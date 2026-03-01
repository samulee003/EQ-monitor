import React from 'react';

/**
 * A11yAnnouncer - 屏幕閱讀器公告組件
 * 
 * 用於宣布動態內容變化，支持 polite 和 assertive 兩種模式
 */

export const A11yAnnouncer: React.FC = () => {
  return (
    <>
      {/* polite: 不會打斷用戶，等待當前內容讀完 */}
      <div
        id="aria-announcer-polite"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
      {/* assertive: 會立即打斷當前內容 */}
      <div
        id="aria-announcer-assertive"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
        }}
      />
    </>
  );
};

export default A11yAnnouncer;
