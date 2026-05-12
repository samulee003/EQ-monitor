import {
  BaseSessionService,
  CreateSessionRequest,
  GetSessionRequest,
  ListSessionsRequest,
  ListSessionsResponse,
  DeleteSessionRequest,
  AppendEventRequest,
} from 'npm:@google/adk';
import { Session } from 'npm:@google/adk';
import { Event } from 'npm:@google/adk';
import { createClient, SupabaseClient } from 'npm:@insforge/sdk';
import { mergeStates } from 'npm:@google/adk';

interface SessionRow {
  id: string;
  app_name: string;
  user_id: string;
  state: Record<string, unknown>;
  create_time: string;
  update_time: string;
}

interface EventRow {
  id: string;
  app_name: string;
  user_id: string;
  session_id: string;
  invocation_id: string | null;
  timestamp: string;
  event_data: Event;
}

/**
 * InsForgeSessionService — 使用 InsForge PostgreSQL 持久化 ADK Session
 *
 * 取代 InMemorySessionService，讓 Edge Function 的無狀態環境
 * 仍能保有跨請求的 Agent 記憶與狀態。
 */
export class InsForgeSessionService extends BaseSessionService {
  private client: SupabaseClient;

  constructor(client?: SupabaseClient) {
    super();
    if (client) {
      this.client = client;
    } else {
      const baseUrl = Deno.env.get('INSFORGE_URL') || Deno.env.get('INSFORGE_BASE_URL') || '';
      const serviceKey = Deno.env.get('SERVICE_ROLE_KEY') || '';
      this.client = createClient({ baseUrl, anonKey: serviceKey });
    }
  }

  async createSession({
    appName,
    userId,
    state,
    sessionId,
  }: CreateSessionRequest): Promise<Session> {
    const id = sessionId || crypto.randomUUID();
    const now = new Date().toISOString();

    // 確保 app_state 存在
    const { data: existingApp } = await this.client.database
      .from('adk_app_states')
      .select('app_name')
      .eq('app_name', appName)
      .maybeSingle();

    if (!existingApp) {
      await this.client.database
        .from('adk_app_states')
        .insert({ app_name: appName, state: {}, update_time: now });
    }

    // 確保 user_state 存在
    const { data: existingUser } = await this.client.database
      .from('adk_user_states')
      .select('app_name, user_id')
      .eq('app_name', appName)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingUser) {
      await this.client.database
        .from('adk_user_states')
        .insert({ app_name: appName, user_id: userId, state: {} });
    }

    const sessionState: Record<string, unknown> = {};
    const appDelta: Record<string, unknown> = {};
    const userDelta: Record<string, unknown> = {};

    if (state) {
      for (const [key, value] of Object.entries(state)) {
        if (key.startsWith('app:')) {
          appDelta[key.replace('app:', '')] = value;
        } else if (key.startsWith('user:')) {
          userDelta[key.replace('user:', '')] = value;
        } else {
          sessionState[key] = value;
        }
      }
    }

    // 合併並寫入 app_state
    if (Object.keys(appDelta).length > 0) {
      const { data: appStateRow } = await this.client.database
        .from('adk_app_states')
        .select('state')
        .eq('app_name', appName)
        .maybeSingle();
      const mergedApp = { ...(appStateRow?.state ?? {}), ...appDelta };
      await this.client.database
        .from('adk_app_states')
        .update({ state: mergedApp, update_time: now })
        .eq('app_name', appName);
    }

    // 合併並寫入 user_state
    if (Object.keys(userDelta).length > 0) {
      const { data: userStateRow } = await this.client.database
        .from('adk_user_states')
        .select('state')
        .eq('app_name', appName)
        .eq('user_id', userId)
        .maybeSingle();
      const mergedUser = { ...(userStateRow?.state ?? {}), ...userDelta };
      await this.client.database
        .from('adk_user_states')
        .update({ state: mergedUser })
        .eq('app_name', appName)
        .eq('user_id', userId);
    }

    // 寫入 session
    const { error } = await this.client.database
      .from('adk_sessions')
      .insert({
        id,
        app_name: appName,
        user_id: userId,
        state: sessionState,
        create_time: now,
        update_time: now,
      });

    if (error) {
      // 可能是重複 sessionId，嘗試取得現有
      const { data: existing } = await this.client.database
        .from('adk_sessions')
        .select('*')
        .eq('id', id)
        .eq('app_name', appName)
        .eq('user_id', userId)
        .maybeSingle();
      if (existing) {
        return this.buildSession(existing as unknown as SessionRow, appName, userId);
      }
      throw new Error(`Failed to create session: ${error.message}`);
    }

    return this.buildSession(
      { id, app_name: appName, user_id: userId, state: sessionState, create_time: now, update_time: now },
      appName,
      userId
    );
  }

  async getSession({
    appName,
    userId,
    sessionId,
    config,
  }: GetSessionRequest): Promise<Session | undefined> {
    const { data: sessionRow } = await this.client.database
      .from('adk_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('app_name', appName)
      .eq('user_id', userId)
      .maybeSingle();

    if (!sessionRow) return undefined;

    const session = await this.buildSession(sessionRow as unknown as SessionRow, appName, userId);

    // 載入事件
    let query = this.client.database
      .from('adk_events')
      .select('*')
      .eq('app_name', appName)
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });

    if (config?.afterTimestamp) {
      query = query.gt('timestamp', new Date(config.afterTimestamp).toISOString());
    }
    if (config?.numRecentEvents) {
      query = query.limit(config.numRecentEvents);
    }

    const { data: events } = await query;
    session.events = (events ?? []).map((e: EventRow) => e.event_data);

    return session;
  }

  async listSessions({
    appName,
    userId,
  }: ListSessionsRequest): Promise<ListSessionsResponse> {
    const { data: rows } = await this.client.database
      .from('adk_sessions')
      .select('id, app_name, user_id, state, create_time, update_time')
      .eq('app_name', appName)
      .eq('user_id', userId);

    const sessions = await Promise.all(
      (rows ?? []).map((row: SessionRow) => this.buildSession(row, appName, userId))
    );

    return { sessions };
  }

  async deleteSession({
    appName,
    userId,
    sessionId,
  }: DeleteSessionRequest): Promise<void> {
    await this.client.database
      .from('adk_events')
      .delete()
      .eq('app_name', appName)
      .eq('user_id', userId)
      .eq('session_id', sessionId);

    await this.client.database
      .from('adk_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('app_name', appName)
      .eq('user_id', userId);
  }

  override async appendEvent({
    session,
    event,
  }: AppendEventRequest): Promise<Event> {
    // 先呼叫父類的 state 更新邏輯
    const processedEvent = await super.appendEvent({ session, event });

    const now = new Date().toISOString();
    const appName = session.appName;
    const userId = session.userId;
    const sessionId = session.id;

    // 更新 session state
    await this.client.database
      .from('adk_sessions')
      .update({ state: session.state as Record<string, unknown>, update_time: now })
      .eq('id', sessionId)
      .eq('app_name', appName)
      .eq('user_id', userId);

    // 寫入事件
    await this.client.database
      .from('adk_events')
      .insert({
        id: processedEvent.id,
        app_name: appName,
        user_id: userId,
        session_id: sessionId,
        invocation_id: processedEvent.invocationId ?? null,
        timestamp: now,
        event_data: processedEvent as unknown as Record<string, unknown>,
      });

    return processedEvent;
  }

  private async buildSession(
    row: SessionRow,
    appName: string,
    userId: string
  ): Promise<Session> {
    const [{ data: appRow }, { data: userRow }] = await Promise.all([
      this.client.database
        .from('adk_app_states')
        .select('state')
        .eq('app_name', appName)
        .maybeSingle(),
      this.client.database
        .from('adk_user_states')
        .select('state')
        .eq('app_name', appName)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const mergedState = mergeStates(
      (appRow?.state ?? {}) as Record<string, unknown>,
      (userRow?.state ?? {}) as Record<string, unknown>,
      row.state
    );

    return {
      id: row.id,
      appName,
      userId,
      state: mergedState,
      events: [],
      lastUpdateTime: new Date(row.update_time).getTime(),
    } as Session;
  }
}
