import React from 'react';

/**
 * SkipLink - 跳轉到主要內容鏈接
 * 
 * 為鍵盤用戶提供快速跳過導航的功能
 * 按 Tab 鍵時第一個顯示，點擊後焦點移動到主要內容
 */

export const SkipLink: React.FC = () => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleClick}
      className="skip-link"
      style={{
        position: 'absolute',
        top: '-40px',
        left: '0',
        background: 'var(--text-primary)',
        color: 'var(--bg-color)',
        padding: '8px 16px',
        zIndex: 10000,
        textDecoration: 'none',
        fontWeight: 600,
        borderRadius: '0 0 4px 0',
        transition: 'top 0.2s',
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      跳轉到主要內容
    </a>
  );
};

export default SkipLink;
