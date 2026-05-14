import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uiIcons } from './icons/SvgIcons';
import { useLanguage } from '../services/LanguageContext';
import { dataAdapter } from '../adapters';
import { type ImportResult } from '../adapters/types';
import { type RulerLogEntry } from '../types/RulerTypes';
import { useAppStore } from '../stores/appStore';
import ExportPanel from './ExportPanel';
import Skeleton from './Skeleton';

const ITEMS_PER_PAGE = 10;

const quadrantPalette = {
    red: {
        dot: '#C58B8A',
        soft: 'rgba(197, 139, 138, 0.18)',
        line: 'rgba(197, 139, 138, 0.42)',
        glow: '0 0 0 6px rgba(197, 139, 138, 0.12)'
    },
    yellow: {
        dot: '#D5C1A5',
        soft: 'rgba(213, 193, 165, 0.2)',
        line: 'rgba(213, 193, 165, 0.44)',
        glow: '0 0 0 6px rgba(213, 193, 165, 0.14)'
    },
    blue: {
        dot: '#97A6B4',
        soft: 'rgba(151, 166, 180, 0.2)',
        line: 'rgba(151, 166, 180, 0.42)',
        glow: '0 0 0 6px rgba(151, 166, 180, 0.14)'
    },
    green: {
        dot: '#AAB09B',
        soft: 'rgba(170, 176, 155, 0.2)',
        line: 'rgba(170, 176, 155, 0.44)',
        glow: '0 0 0 6px rgba(170, 176, 155, 0.14)'
    },
    gray: {
        dot: 'rgba(148, 148, 148, 0.8)',
        soft: 'rgba(148, 148, 148, 0.14)',
        line: 'rgba(148, 148, 148, 0.25)',
        glow: '0 0 0 6px rgba(148, 148, 148, 0.08)'
    }
} as const;

type QuadrantKey = keyof typeof quadrantPalette;
type TimelineFilterKey = 'all' | Exclude<QuadrantKey, 'gray'>;

const Timeline: React.FC = () => {
    const { t } = useLanguage();
    const [logs, setLogs] = useState<RulerLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [showExport, setShowExport] = useState(false);
    const [activeFilter, setActiveFilter] = useState<TimelineFilterKey>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const listTopRef = useRef<HTMLDivElement>(null);

    const loadLogs = useCallback(async () => {
        const data = await dataAdapter.logs.export();
        setLogs(data);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadLogs();
            setIsLoading(false);
        }, 300);
        return () => clearTimeout(timer);
    }, [loadLogs]);

    useEffect(() => {
        if (importResult) {
            const timer = setTimeout(() => setImportResult(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [importResult]);

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleDeleteConfirm = async () => {
        if (deleteConfirmId) {
            const allLogs = await dataAdapter.logs.export();
            const targetLog = allLogs.find((log: RulerLogEntry) => log.id === deleteConfirmId);
            if (targetLog && targetLog.id) {
                await dataAdapter.logs.delete(targetLog.id);
            } else {
                const updated = allLogs.filter((log: RulerLogEntry) => log.timestamp !== deleteConfirmId);
                await dataAdapter.logs.import(updated);
            }
            await loadLogs();
            setDeleteConfirmId(null);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmId(null);
    };

    const handleEditStart = (log: RulerLogEntry) => {
        setEditingId(log.id);
        setEditText(log.expressing?.expression || '');
    };

    const handleEditSave = async (id: string) => {
        const allLogs = await dataAdapter.logs.export();
        const targetLog = allLogs.find((log: RulerLogEntry) => log.id === id);
        if (targetLog && targetLog.id) {
            await dataAdapter.logs.update(targetLog.id, {
                expressing: {
                    ...(targetLog.expressing || {}),
                    expression: editText,
                    prompt: targetLog.expressing?.prompt || '',
                    mode: targetLog.expressing?.mode || 'write'
                }
            });
        } else {
            const updated = allLogs.map((log: RulerLogEntry) => {
                if (log.timestamp === id) {
                    return {
                        ...log,
                        expressing: {
                            ...(log.expressing || {}),
                            expression: editText,
                            prompt: log.expressing?.prompt || '',
                            mode: log.expressing?.mode || 'write'
                        }
                    };
                }
                return log;
            });
            await dataAdapter.logs.import(updated);
        }
        await loadLogs();
        setEditingId(null);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleEmptyStartClick = () => {
        useAppStore.getState().setView('home');
    };

    const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target?.result as string;
            let parsed: unknown;
            try {
                parsed = JSON.parse(content || '[]');
            } catch {
                setImportResult({
                    success: false,
                    imported: 0,
                    skipped: 0,
                    message: t('檔案格式錯誤，請確認為有效的 JSON 檔案')
                });
                return;
            }
            const result = await dataAdapter.logs.import(parsed as RulerLogEntry[]);
            setImportResult(result);

            if (result.success && result.imported > 0) {
                await loadLogs();
            }
        };
        reader.onerror = () => {
            setImportResult({
                success: false,
                imported: 0,
                skipped: 0,
                message: t('無法讀取檔案')
            });
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleDateString('zh-TW', {
            month: 'short',
            day: 'numeric',
            weekday: 'narrow',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getQuadrantKey = (log: RulerLogEntry): QuadrantKey => {
        const quadrant = log.emotions?.[0]?.quadrant;
        if (quadrant === 'red' || quadrant === 'yellow' || quadrant === 'blue' || quadrant === 'green') {
            return quadrant;
        }
        return 'gray';
    };

    const quadrantSummary = useMemo(() => {
        const counts = logs.reduce<Record<QuadrantKey, number>>((acc, log) => {
            const key = getQuadrantKey(log);
            acc[key] += 1;
            return acc;
        }, { red: 0, yellow: 0, blue: 0, green: 0, gray: 0 });

        return [
            { key: 'all' as const, label: t('全部'), count: logs.length, active: activeFilter === 'all' },
            { key: 'red' as const, label: t('高能低悅'), count: counts.red, active: activeFilter === 'red' },
            { key: 'yellow' as const, label: t('高能高悅'), count: counts.yellow, active: activeFilter === 'yellow' },
            { key: 'blue' as const, label: t('低能低悅'), count: counts.blue, active: activeFilter === 'blue' },
            { key: 'green' as const, label: t('低能高悅'), count: counts.green, active: activeFilter === 'green' }
        ];
    }, [activeFilter, logs, t]);

    const filteredLogs = useMemo(() => {
        if (activeFilter === 'all') return logs;
        return logs.filter((log) => getQuadrantKey(log) === activeFilter);
    }, [activeFilter, logs]);

    const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredLogs, currentPage]);

    const narrativeStats = useMemo(() => {
        const currentPageStart = (currentPage - 1) * ITEMS_PER_PAGE + 1;
        const currentPageEnd = Math.min(currentPage * ITEMS_PER_PAGE, filteredLogs.length);
        const expressiveCount = filteredLogs.filter((log) => Boolean(log.expressing?.expression?.trim())).length;
        return {
            total: filteredLogs.length,
            pageRange: filteredLogs.length > 0 ? `${currentPageStart}-${currentPageEnd}` : '0',
            expressiveCount
        };
    }, [currentPage, filteredLogs]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleFilterChange = (filter: TimelineFilterKey) => {
        setActiveFilter(filter);
        setCurrentPage(1);
    };

    if (isLoading) {
        return (
            <div className="timeline-shell fade-in">
                <div className="timeline-loading-hero">
                    <Skeleton type="text" />
                    <Skeleton type="text" className="short" />
                </div>
                <div className="timeline-loading-list">
                    <Skeleton type="card" />
                    <Skeleton type="card" />
                </div>
                <style>{`
                    .timeline-loading-hero { margin-bottom: 2rem; }
                    .timeline-loading-list { display: flex; flex-direction: column; gap: 1.25rem; }
                `}</style>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="timeline-shell fade-in">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleImportJSON}
                    style={{ display: 'none' }}
                />
                <section className="timeline-empty-hero">
                    <div className="timeline-empty-orb timeline-empty-orb-red"></div>
                    <div className="timeline-empty-orb timeline-empty-orb-blue"></div>
                    <div className="timeline-empty-orb timeline-empty-orb-green"></div>
                    <div className="timeline-empty-mark">
                        <span className="timeline-empty-plus">+</span>
                    </div>
                    <span className="timeline-kicker">{t('歷史時間軸')}</span>
                    <h2>{t('第一筆情緒紀錄，會為之後的洞察打開入口。')}</h2>
                    <p>{t('當你開始留下情緒與情境，這裡會逐步長出屬於你的敘事軌跡、象限分布與回顧節奏。')}</p>

                    <div className="timeline-empty-feature-grid">
                        <div className="timeline-empty-feature">
                            <strong>{t('情緒節點')}</strong>
                            <span>{t('保留每次高低起伏的時間與脈絡')}</span>
                        </div>
                        <div className="timeline-empty-feature">
                            <strong>{t('回顧線索')}</strong>
                            <span>{t('從事件、人物與地點整理出重複模式')}</span>
                        </div>
                        <div className="timeline-empty-feature">
                            <strong>{t('備份匯入')}</strong>
                            <span>{t('若你已有 JSON 備份，也能在這裡平滑接回紀錄')}</span>
                        </div>
                    </div>

                    <div className="timeline-empty-actions">
                        <button
                            className="timeline-empty-start"
                            type="button"
                            onClick={handleEmptyStartClick}
                            data-testid="timeline-empty-start"
                        >
                            <span>{t('開始第一筆紀錄')}</span>
                        </button>
                        <button className="timeline-import-prompt" type="button" onClick={handleImportClick}>
                            <span className="timeline-import-icon">📥</span>
                            <span>{t('匯入備份檔案')}</span>
                        </button>
                    </div>
                </section>

                {importResult && (
                    <div className={`import-toast ${importResult.success ? 'success' : 'error'}`}>
                        {t(importResult.message)}
                    </div>
                )}

                <style>{`
                    .timeline-shell {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        gap: 1.5rem;
                    }
                    .timeline-empty-hero {
                        position: relative;
                        overflow: hidden;
                        padding: 3.5rem 1.5rem;
                        border-radius: 32px;
                        text-align: center;
                        background:
                            radial-gradient(circle at top left, rgba(213, 193, 165, 0.22), transparent 35%),
                            radial-gradient(circle at right center, rgba(151, 166, 180, 0.2), transparent 32%),
                            linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.18));
                        border: 1px solid var(--glass-border);
                        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
                    }
                    .timeline-empty-orb {
                        position: absolute;
                        border-radius: 999px;
                        filter: blur(18px);
                        opacity: 0.75;
                    }
                    .timeline-empty-orb-red { width: 120px; height: 120px; top: -24px; left: -28px; background: rgba(197, 139, 138, 0.2); }
                    .timeline-empty-orb-blue { width: 160px; height: 160px; right: -42px; top: 22%; background: rgba(151, 166, 180, 0.18); }
                    .timeline-empty-orb-green { width: 120px; height: 120px; bottom: -24px; left: 22%; background: rgba(170, 176, 155, 0.16); }
                    .timeline-empty-mark {
                        position: relative;
                        z-index: 1;
                        width: 96px;
                        height: 96px;
                        margin: 0 auto 1.5rem;
                        border-radius: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: linear-gradient(135deg, rgba(245, 243, 239, 0.78), rgba(255,255,255,0.32));
                        box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 18px 32px rgba(0,0,0,0.08);
                    }
                    .timeline-empty-plus {
                        font-size: 2.6rem;
                        line-height: 1;
                        color: var(--text-primary);
                    }
                    .timeline-kicker {
                        position: relative;
                        z-index: 1;
                        display: inline-flex;
                        padding: 0.45rem 0.9rem;
                        border-radius: 999px;
                        background: rgba(255,255,255,0.38);
                        border: 1px solid rgba(255,255,255,0.5);
                        font-size: 0.78rem;
                        letter-spacing: 0.08em;
                        color: var(--text-secondary);
                        margin-bottom: 1rem;
                    }
                    .timeline-empty-hero h2 {
                        position: relative;
                        z-index: 1;
                        margin: 0 0 0.75rem;
                        color: var(--text-primary);
                        font-size: clamp(1.7rem, 5vw, 2.3rem);
                        line-height: 1.18;
                    }
                    .timeline-empty-hero p {
                        position: relative;
                        z-index: 1;
                        max-width: 34rem;
                        margin: 0 auto;
                        color: var(--text-secondary);
                        line-height: 1.75;
                    }
                    .timeline-empty-feature-grid {
                        position: relative;
                        z-index: 1;
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                        gap: 0.9rem;
                        margin: 2rem 0;
                    }
                    .timeline-empty-feature {
                        text-align: left;
                        padding: 1rem;
                        border-radius: 22px;
                        background: rgba(255,255,255,0.26);
                        border: 1px solid rgba(255,255,255,0.38);
                        backdrop-filter: blur(18px);
                    }
                    .timeline-empty-feature strong {
                        display: block;
                        margin-bottom: 0.35rem;
                        color: var(--text-primary);
                    }
                    .timeline-empty-feature span {
                        display: block;
                        color: var(--text-secondary);
                        font-size: 0.88rem;
                        line-height: 1.6;
                    }
                    .timeline-import-prompt {
                        position: relative;
                        z-index: 1;
                        display: inline-flex;
                        align-items: center;
                        gap: 0.65rem;
                        min-height: 52px;
                        padding: 0.9rem 1.35rem;
                        border-radius: 999px;
                        border: 1px dashed rgba(170, 176, 155, 0.75);
                        background: rgba(255,255,255,0.32);
                        color: var(--text-primary);
                        cursor: pointer;
                        transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
                    }
                    .timeline-empty-actions {
                        position: relative;
                        z-index: 1;
                        display: flex;
                        justify-content: center;
                        gap: 0.75rem;
                        flex-wrap: wrap;
                    }
                    .timeline-empty-start {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 52px;
                        padding: 0.9rem 1.35rem;
                        border-radius: 999px;
                        border: none;
                        background: var(--text-primary);
                        color: var(--bg-color);
                        cursor: pointer;
                        transition: transform 0.25s ease, background 0.25s ease;
                    }
                    .timeline-import-prompt:hover,
                    .timeline-empty-start:hover {
                        transform: translateY(-1px);
                    }
                    .timeline-import-prompt:hover {
                        background: rgba(255,255,255,0.44);
                        border-color: rgba(170, 176, 155, 1);
                    }
                    .timeline-import-icon { font-size: 1rem; }
                    .import-toast {
                        position: fixed;
                        left: 50%;
                        bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
                        transform: translateX(-50%);
                        padding: 12px 24px;
                        border-radius: 999px;
                        font-size: 0.9rem;
                        animation: slideUp 0.3s ease;
                        z-index: 1000;
                        box-shadow: 0 14px 30px rgba(0,0,0,0.16);
                        white-space: nowrap;
                    }
                    .import-toast.success { background: var(--color-green); color: var(--text-primary); }
                    .import-toast.error { background: var(--color-red); color: var(--text-primary); }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                        to { opacity: 1; transform: translateX(-50%) translateY(0); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="timeline-shell fade-in">
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleImportJSON}
                style={{ display: 'none' }}
            />

            <section className="timeline-hero">
                <div className="timeline-hero-copy">
                    <span className="timeline-kicker">{t('歷史 / Timeline')}</span>
                    <h2>{t('把情緒記錄整理成一條能回看的內在敘事。')}</h2>
                    <p>{t('你已累積 {{count}} 筆紀錄；這一頁將時間、情緒象限與事件線索收進同一條光感時間軸，幫你更安靜地回看自己。').replace('{{count}}', String(narrativeStats.total))}</p>
                </div>

                <div className="timeline-hero-panel">
                    <div className="timeline-hero-metric">
                        <span className="timeline-hero-label">{t('目前頁面')}</span>
                        <strong>{narrativeStats.pageRange}</strong>
                    </div>
                    <div className="timeline-hero-metric">
                        <span className="timeline-hero-label">{t('已寫下表達')}</span>
                        <strong>{narrativeStats.expressiveCount}</strong>
                    </div>
                    <div className="timeline-hero-actions">
                        <button className="timeline-action secondary" onClick={handleImportClick} title={t('匯入 JSON 備份')}>
                            <span>{t('匯入')}</span>
                        </button>
                        <button className="timeline-action primary" onClick={() => setShowExport(true)} title={t('導出記錄')}>
                            <span className="export-icon">{uiIcons.folder}</span>
                            <span>{t('導出')}</span>
                        </button>
                    </div>
                </div>
            </section>

            <section className="timeline-chip-row" aria-label={t('情緒象限摘要')}>
                {quadrantSummary.map((chip) => {
                    const palette = chip.key === 'all' ? null : quadrantPalette[chip.key as QuadrantKey];
                    return (
                        <button
                            key={chip.key}
                            type="button"
                            className={`timeline-chip ${chip.active ? 'active' : ''}`}
                            aria-pressed={chip.active}
                            onClick={() => handleFilterChange(chip.key)}
                            data-testid={`timeline-chip-${chip.key}`}
                        >
                            {palette && <span className="timeline-chip-dot" style={{ background: palette.dot }}></span>}
                            <span>{chip.label}</span>
                            <strong>{chip.count}</strong>
                        </button>
                    );
                })}
            </section>

            {importResult && (
                <div className={`import-toast ${importResult.success ? 'success' : 'error'}`}>
                    {t(importResult.message)}
                </div>
            )}

            <div className="timeline-inline-import-note">
                <span className="timeline-inline-import-badge">{t('備份')}</span>
                <p>{t('可隨時匯入既有 JSON 紀錄，新的資料會沿用目前的列表與分頁流程呈現。')}</p>
            </div>

            <div ref={listTopRef} className="timeline-stream">
                <div className="timeline-stream-line"></div>
                {paginatedLogs.map((log, index) => {
                    const quadrantKey = getQuadrantKey(log);
                    const palette = quadrantPalette[quadrantKey];
                    const tags = [log.understanding?.what, log.understanding?.who, log.understanding?.where].filter(Boolean);

                    return (
                        <article
                            key={log.id || index}
                            className="timeline-entry"
                            data-testid={`timeline-entry-${log.id || index}`}
                            style={
                                {
                                    '--entry-accent': palette.dot,
                                    '--entry-soft': palette.soft,
                                    '--entry-line': palette.line,
                                    '--entry-glow': palette.glow
                                } as React.CSSProperties
                            }
                        >
                            <div className="timeline-entry-anchor">
                                <span className="timeline-entry-date">{formatDate(log.timestamp)}</span>
                            </div>

                            <div className="timeline-entry-node">
                                <span className="timeline-entry-dot"></span>
                            </div>

                            <div className="timeline-card">
                                <div className="timeline-card-glow"></div>
                                <div className="timeline-card-top">
                                    <div className="timeline-card-heading">
                                        <div className="timeline-card-emotion-mark">
                                            <span className="timeline-card-emotion-core"></span>
                                        </div>
                                        <div>
                                            <h3 className="card-emotion-name">{(log.emotions || []).map((emotion) => t(emotion.name)).join('、')}</h3>
                                            <div className="timeline-card-meta">
                                                <span>{t('強度')} {log.intensity}/10</span>
                                                {log.understanding?.trigger && (
                                                    <>
                                                        <span className="timeline-meta-separator">•</span>
                                                        <span>{t('事件')}{t('：')}{t(log.understanding.trigger)}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-actions">
                                        {editingId !== log.id && (
                                            <>
                                                <button className="edit-btn" aria-label="編輯" onClick={() => handleEditStart(log)}>✎</button>
                                                <button className="delete-btn" aria-label="刪除" onClick={() => handleDeleteClick(log.id || log.timestamp)}>✕</button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="timeline-card-body">
                                    {tags.length > 0 && (
                                        <div className="card-tags">
                                            {tags.map((tag) => (
                                                <span key={`${log.id}-${tag}`} className="mini-tag">#{t(tag || '')}</span>
                                            ))}
                                        </div>
                                    )}

                                    {editingId === log.id ? (
                                        <div className="edit-area">
                                            <textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="edit-textarea"
                                                placeholder={t('更新你的感受表達...')}
                                            />
                                            <div className="edit-actions">
                                                <button className="save-btn" onClick={() => handleEditSave(log.id || log.timestamp)}>{t('儲存')}</button>
                                                <button className="cancel-btn" onClick={() => setEditingId(null)}>{t('取消')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="timeline-story-block">
                                            {log.expressing?.expression ? (
                                                <p className="card-note">
                                                    {t('「')} {t(log.expressing.expression)} {t('」')}
                                                </p>
                                            ) : (
                                                <p className="timeline-story-placeholder">{t('這筆紀錄尚未寫下表達內容，但情緒與情境已被保留下來。')}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    );
                })}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="page-btn"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        ← {t('上一頁')}
                    </button>
                    <span className="page-info">{currentPage} / {totalPages}</span>
                    <button
                        className="page-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        {t('下一頁')} →
                    </button>
                </div>
            )}

            <style>{`
                .timeline-shell {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .timeline-hero {
                    position: relative;
                    overflow: hidden;
                    display: grid;
                    grid-template-columns: minmax(0, 1.6fr) minmax(280px, 0.95fr);
                    gap: 1rem;
                    padding: 1.35rem;
                    border-radius: 32px;
                    background:
                        radial-gradient(circle at top left, rgba(213, 193, 165, 0.28), transparent 30%),
                        radial-gradient(circle at right center, rgba(151, 166, 180, 0.22), transparent 32%),
                        radial-gradient(circle at bottom left, rgba(170, 176, 155, 0.18), transparent 26%),
                        linear-gradient(180deg, rgba(255,255,255,0.45), rgba(255,255,255,0.18));
                    border: 1px solid var(--glass-border);
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.08);
                }
                .timeline-hero-copy,
                .timeline-hero-panel {
                    position: relative;
                    z-index: 1;
                }
                .timeline-kicker {
                    display: inline-flex;
                    padding: 0.45rem 0.9rem;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.34);
                    border: 1px solid rgba(255,255,255,0.48);
                    font-size: 0.78rem;
                    letter-spacing: 0.08em;
                    color: var(--text-secondary);
                    margin-bottom: 1rem;
                }
                .timeline-hero-copy h2 {
                    margin: 0 0 0.8rem;
                    font-size: clamp(1.8rem, 4vw, 2.5rem);
                    line-height: 1.15;
                    color: var(--text-primary);
                }
                .timeline-hero-copy p {
                    margin: 0;
                    max-width: 38rem;
                    color: var(--text-secondary);
                    line-height: 1.75;
                }
                .timeline-hero-panel {
                    align-self: stretch;
                    display: flex;
                    flex-direction: column;
                    gap: 0.9rem;
                    padding: 1rem;
                    border-radius: 26px;
                    background: rgba(255,255,255,0.24);
                    border: 1px solid rgba(255,255,255,0.38);
                    backdrop-filter: blur(18px);
                }
                .timeline-hero-metric {
                    padding-bottom: 0.85rem;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                }
                .timeline-hero-metric:last-of-type {
                    border-bottom: none;
                    padding-bottom: 0;
                }
                .timeline-hero-label {
                    display: block;
                    margin-bottom: 0.25rem;
                    color: var(--text-secondary);
                    font-size: 0.82rem;
                }
                .timeline-hero-metric strong {
                    color: var(--text-primary);
                    font-size: 1.5rem;
                    line-height: 1.1;
                }
                .timeline-hero-actions {
                    margin-top: auto;
                    display: flex;
                    gap: 0.75rem;
                    flex-wrap: wrap;
                }
                .timeline-action {
                    min-height: 46px;
                    padding: 0.82rem 1.15rem;
                    border-radius: 999px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.55rem;
                    cursor: pointer;
                    transition: transform 0.25s ease, background 0.25s ease, border-color 0.25s ease;
                    font-size: 0.92rem;
                }
                .timeline-action:hover { transform: translateY(-1px); }
                .timeline-action.primary {
                    border: none;
                    background: var(--text-primary);
                    color: var(--bg-color);
                }
                .timeline-action.secondary {
                    border: 1px dashed rgba(170, 176, 155, 0.8);
                    background: rgba(255,255,255,0.34);
                    color: var(--text-primary);
                }
                .timeline-chip-row {
                    display: flex;
                    gap: 0.75rem;
                    overflow-x: auto;
                    padding: 0.15rem 0 0.4rem;
                    scrollbar-width: none;
                }
                .timeline-chip-row::-webkit-scrollbar { display: none; }
                .timeline-chip {
                    flex-shrink: 0;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.55rem;
                    min-height: 44px;
                    padding: 0.75rem 1rem;
                    border-radius: 999px;
                    border: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.24);
                    color: var(--text-secondary);
                    backdrop-filter: blur(18px);
                }
                .timeline-chip.active {
                    background: var(--text-primary);
                    color: var(--bg-color);
                    border-color: var(--text-primary);
                }
                .timeline-chip strong {
                    font-size: 0.8rem;
                    opacity: 0.9;
                }
                .timeline-chip-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 999px;
                }
                .timeline-inline-import-note {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.9rem 1rem;
                    border-radius: 22px;
                    background: rgba(255,255,255,0.22);
                    border: 1px solid var(--glass-border);
                    color: var(--text-secondary);
                }
                .timeline-inline-import-note p {
                    margin: 0;
                    line-height: 1.6;
                }
                .timeline-inline-import-badge {
                    flex-shrink: 0;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 52px;
                    min-height: 32px;
                    padding: 0 0.8rem;
                    border-radius: 999px;
                    background: rgba(170, 176, 155, 0.16);
                    color: var(--text-primary);
                }
                .timeline-stream {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding-top: 0.35rem;
                }
                .timeline-stream-line {
                    position: absolute;
                    left: 144px;
                    top: 0;
                    bottom: 0;
                    width: 2px;
                    background: linear-gradient(to bottom, transparent, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.1) 90%, transparent);
                }
                .timeline-entry {
                    position: relative;
                    display: grid;
                    grid-template-columns: 128px 32px minmax(0, 1fr);
                    gap: 0.9rem;
                    align-items: start;
                }
                .timeline-entry-anchor {
                    padding-top: 1rem;
                    text-align: right;
                }
                .timeline-entry-date {
                    font-size: 0.78rem;
                    line-height: 1.5;
                    color: var(--text-secondary);
                    letter-spacing: 0.03em;
                }
                .timeline-entry-node {
                    position: relative;
                    z-index: 1;
                    display: flex;
                    justify-content: center;
                    padding-top: 1rem;
                }
                .timeline-entry-dot {
                    width: 14px;
                    height: 14px;
                    border-radius: 999px;
                    background: var(--entry-accent);
                    box-shadow: var(--entry-glow);
                    border: 2px solid rgba(255,255,255,0.9);
                }
                .timeline-card {
                    position: relative;
                    overflow: hidden;
                    padding: 1.2rem;
                    border-radius: 28px;
                    background: rgba(255,255,255,0.24);
                    border: 1px solid rgba(255,255,255,0.34);
                    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.06);
                    backdrop-filter: blur(18px);
                }
                .timeline-card::before {
                    content: '';
                    position: absolute;
                    inset: 0 auto 0 0;
                    width: 4px;
                    background: var(--entry-accent);
                }
                .timeline-card-glow {
                    position: absolute;
                    inset: auto -40px -40px auto;
                    width: 140px;
                    height: 140px;
                    border-radius: 999px;
                    background: radial-gradient(circle, var(--entry-soft) 0%, transparent 72%);
                    pointer-events: none;
                }
                .timeline-card-top {
                    position: relative;
                    display: flex;
                    justify-content: space-between;
                    gap: 1rem;
                    margin-bottom: 1rem;
                }
                .timeline-card-heading {
                    display: flex;
                    gap: 0.85rem;
                    align-items: flex-start;
                    min-width: 0;
                }
                .timeline-card-emotion-mark {
                    flex-shrink: 0;
                    width: 42px;
                    height: 42px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--entry-soft);
                }
                .timeline-card-emotion-core {
                    width: 14px;
                    height: 14px;
                    border-radius: 999px;
                    background: var(--entry-accent);
                }
                .card-emotion-name {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 1.12rem;
                    line-height: 1.35;
                }
                .timeline-card-meta {
                    margin-top: 0.35rem;
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 0.35rem;
                    color: var(--text-secondary);
                    font-size: 0.84rem;
                    line-height: 1.6;
                }
                .timeline-meta-separator { opacity: 0.65; }
                .card-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.4rem;
                    flex-shrink: 0;
                }
                .edit-btn, .delete-btn {
                    width: 36px;
                    height: 36px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.3);
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: background 0.25s ease, color 0.25s ease, transform 0.25s ease;
                }
                .edit-btn:hover, .delete-btn:hover { transform: translateY(-1px); }
                .edit-btn:hover { color: var(--text-primary); background: rgba(213, 193, 165, 0.22); }
                .delete-btn:hover { color: var(--color-red); background: rgba(197, 139, 138, 0.18); }
                .timeline-card-body {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 0.95rem;
                }
                .card-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.55rem;
                }
                .mini-tag {
                    display: inline-flex;
                    align-items: center;
                    min-height: 30px;
                    padding: 0.35rem 0.8rem;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.28);
                    border: 1px solid rgba(255,255,255,0.34);
                    color: var(--text-secondary);
                    font-size: 0.78rem;
                }
                .timeline-story-block {
                    border-radius: 22px;
                    padding: 1rem;
                    background: rgba(255,255,255,0.28);
                    border: 1px solid rgba(255,255,255,0.36);
                }
                .card-note {
                    margin: 0;
                    color: var(--text-primary);
                    line-height: 1.8;
                }
                .timeline-story-placeholder {
                    margin: 0;
                    color: var(--text-secondary);
                    line-height: 1.7;
                }
                .edit-area {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .edit-textarea {
                    width: 100%;
                    min-height: 96px;
                    border-radius: 18px;
                    border: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.4);
                    color: var(--text-primary);
                    padding: 0.9rem 1rem;
                    font-family: inherit;
                    font-size: 0.92rem;
                    line-height: 1.7;
                    resize: vertical;
                    outline: none;
                }
                .edit-textarea:focus {
                    border-color: var(--color-yellow);
                    box-shadow: 0 0 0 3px rgba(213, 193, 165, 0.18);
                }
                .edit-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.65rem;
                }
                .save-btn, .cancel-btn {
                    min-height: 40px;
                    padding: 0.65rem 1rem;
                    border-radius: 999px;
                    cursor: pointer;
                    transition: transform 0.25s ease, background 0.25s ease;
                }
                .save-btn {
                    border: none;
                    background: var(--text-primary);
                    color: var(--bg-color);
                }
                .cancel-btn {
                    border: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.28);
                    color: var(--text-secondary);
                }
                .save-btn:hover, .cancel-btn:hover { transform: translateY(-1px); }
                .pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.9rem;
                    margin-top: 0.5rem;
                    padding: 0.6rem 0 0;
                }
                .page-btn {
                    min-height: 44px;
                    padding: 0.75rem 1.15rem;
                    border-radius: 999px;
                    border: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.26);
                    color: var(--text-primary);
                    cursor: pointer;
                }
                .page-btn:disabled {
                    opacity: 0.35;
                    cursor: not-allowed;
                }
                .page-info {
                    min-width: 64px;
                    text-align: center;
                    color: var(--text-secondary);
                }
                .import-toast {
                    position: fixed;
                    left: 50%;
                    bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    border-radius: 999px;
                    font-size: 0.9rem;
                    animation: slideUp 0.3s ease;
                    z-index: 1000;
                    box-shadow: 0 14px 30px rgba(0,0,0,0.16);
                    white-space: nowrap;
                }
                .import-toast.success { background: var(--color-green); color: var(--text-primary); }
                .import-toast.error { background: var(--color-red); color: var(--text-primary); }
                .export-icon {
                    width: 16px;
                    height: 16px;
                    display: inline-flex;
                }
                .export-icon svg {
                    width: 100%;
                    height: 100%;
                }
                .delete-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.55);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .delete-modal {
                    max-width: 360px;
                    padding: 2rem;
                    border-radius: 28px;
                    background: rgba(255,255,255,0.72);
                    border: 1px solid rgba(255,255,255,0.46);
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.16);
                }
                .delete-modal-icon {
                    width: 48px;
                    height: 48px;
                    margin: 0 auto 1rem;
                    color: var(--color-red);
                    opacity: 0.85;
                }
                .delete-modal-icon svg {
                    width: 100%;
                    height: 100%;
                }
                .delete-modal h3 {
                    margin: 0 0 0.5rem;
                    color: var(--text-primary);
                }
                .delete-modal p {
                    margin: 0 0 1.5rem;
                    color: var(--text-secondary);
                    line-height: 1.7;
                }
                .delete-modal-actions {
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                }
                .delete-confirm-btn, .delete-cancel-btn {
                    min-height: 44px;
                    padding: 0.8rem 1.2rem;
                    border-radius: 999px;
                    cursor: pointer;
                }
                .delete-confirm-btn {
                    border: none;
                    background: var(--color-red);
                    color: var(--text-primary);
                }
                .delete-cancel-btn {
                    border: 1px solid var(--glass-border);
                    background: rgba(255,255,255,0.26);
                    color: var(--text-secondary);
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
                @media (max-width: 820px) {
                    .timeline-hero {
                        grid-template-columns: 1fr;
                    }
                    .timeline-stream-line {
                        left: 14px;
                    }
                    .timeline-entry {
                        grid-template-columns: 24px minmax(0, 1fr);
                    }
                    .timeline-entry-anchor {
                        grid-column: 2;
                        order: -1;
                        padding-top: 0;
                        text-align: left;
                        padding-left: 0.2rem;
                    }
                    .timeline-entry-node {
                        grid-column: 1;
                        grid-row: 1 / span 2;
                        padding-top: 0.2rem;
                    }
                    .timeline-card {
                        grid-column: 2;
                    }
                }
                @media (max-width: 640px) {
                    .timeline-shell {
                        gap: 0.85rem;
                    }
                    .timeline-hero,
                    .timeline-card,
                    .timeline-empty-hero {
                        border-radius: 24px;
                    }
                    .timeline-inline-import-note {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .timeline-hero-actions,
                    .delete-modal-actions,
                    .edit-actions {
                        flex-direction: column;
                    }
                    .timeline-action,
                    .save-btn,
                    .cancel-btn,
                    .delete-confirm-btn,
                    .delete-cancel-btn {
                        width: 100%;
                    }
                }
            `}</style>

            {deleteConfirmId && (
                <div className="delete-modal-overlay" onClick={handleDeleteCancel}>
                    <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="delete-modal-icon">{uiIcons.trash}</div>
                        <h3>{t('確定要刪除嗎？')}</h3>
                        <p>{t('這項操作無法復原，記錄將永久移除。')}</p>
                        <div className="delete-modal-actions">
                            <button className="delete-cancel-btn" onClick={handleDeleteCancel}>{t('取消')}</button>
                            <button className="delete-confirm-btn" onClick={handleDeleteConfirm}>{t('確認刪除')}</button>
                        </div>
                    </div>
                </div>
            )}

            {showExport && (
                <ExportPanel logs={logs} onClose={() => setShowExport(false)} />
            )}
        </div>
    );
};

export default Timeline;
