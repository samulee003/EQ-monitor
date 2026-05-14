import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { uiIcons } from './icons/SvgIcons';
import { useLanguage } from '../services/LanguageContext';
import { dataAdapter } from '../adapters';
import { type ImportResult } from '../adapters/types';
import { type RulerLogEntry } from '../types/RulerTypes';
import { useAppStore } from '../stores/appStore';
import ExportPanel from './ExportPanel';
import Skeleton from './Skeleton';
import './Timeline.css';

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
        let isMounted = true;

        const loadInitialLogs = async () => {
            await loadLogs();
            if (isMounted) {
                setIsLoading(false);
            }
        };

        void loadInitialLogs();
        return () => {
            isMounted = false;
        };
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
