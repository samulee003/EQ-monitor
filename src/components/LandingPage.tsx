import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
  onCoach: () => void;
}

const scrollToSection = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onCoach }) => {
  return (
    <section className="landing-page" aria-label="關於我們">
      <section className="landing-hero" aria-labelledby="landing-title">
        <header className="landing-nav" aria-label="關於我們導覽">
          <a className="landing-brand" href="#home" aria-label="回到今日心情">
            <img src="/logo.png" alt="" />
            <span>今心</span>
          </a>
          <div className="landing-nav-actions">
            <button type="button" onClick={() => scrollToSection('landing-method')}>知心四式</button>
            <button type="button" onClick={() => scrollToSection('landing-coach')}>阿念教練</button>
            <button type="button" onClick={() => scrollToSection('landing-safety')}>安心使用</button>
            <button type="button" className="landing-nav-primary" onClick={onStart}>開始今天練習</button>
          </div>
        </header>

        <div className="landing-hero-copy">
          <p className="landing-kicker">關於我們</p>
          <h1 id="landing-title">今心是一個讓你先停一下的情緒覺察 App。</h1>
          <p className="landing-lead">
            今心是一個早期試玩的情緒覺察小工具。你可以從四色狀態開始，走過心照、喚名、安神、動念，讓阿念教練陪你把下一步變小、變清楚。
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-primary" onClick={onStart}>進入今日心情</button>
            <button type="button" className="landing-secondary" onClick={onCoach}>打開教練</button>
          </div>
          <p className="landing-small-note">V1.0 適合小圈朋友試玩；不是心理治療，也不替你評分。</p>
        </div>
      </section>

      <section className="landing-band landing-problem" aria-labelledby="landing-why-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">為什麼做今心</p>
          <h2 id="landing-why-title">很多時候，我們不是不想整理心情，是不知道從哪裡開始。</h2>
        </div>
        <div className="landing-insight-row">
          <article>
            <span>01</span>
            <h3>先給模糊一個位置</h3>
            <p>不用先說完整故事，只要先選一個接近當下的能量與心情。</p>
          </article>
          <article>
            <span>02</span>
            <h3>把練習拆成四小步</h3>
            <p>從看見、命名、安住，到選一個今天真的做得到的小行動。</p>
          </article>
          <article>
            <span>03</span>
            <h3>讓阿念接續脈絡</h3>
            <p>阿念會看近期記錄與當下訊息，陪你判斷下一步，不只回一句安慰。</p>
          </article>
        </div>
      </section>

      <section id="landing-method" className="landing-band landing-method" aria-labelledby="landing-method-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">知心四式</p>
          <h2 id="landing-method-title">一套給日常使用的情緒整理路徑。</h2>
        </div>
        <div className="landing-method-grid">
          <div className="landing-method-card">
            <strong>心照</strong>
            <p>心照一念，先看清此刻。</p>
          </div>
          <div className="landing-method-card">
            <strong>喚名</strong>
            <p>喚其真名，精準靠近感受。</p>
          </div>
          <div className="landing-method-card">
            <strong>安神</strong>
            <p>安住心神，讓感受與需要有地方放。</p>
          </div>
          <div className="landing-method-card">
            <strong>動念</strong>
            <p>一念可轉，選一個可做的小行動。</p>
          </div>
        </div>
      </section>

      <section className="landing-band landing-flow" aria-labelledby="landing-flow-title">
        <div className="landing-flow-copy">
          <p className="landing-kicker">入口很輕</p>
          <h2 id="landing-flow-title">網頁可以直接開始，LINE 可以當作日常對話入口。</h2>
          <p>
            V1.0 先讓朋友用 PWA 記錄今天心情，也能加入 LINE 官方帳號完成一段知心四式。WeChat 朋友目前先走網頁版，不需要先理解完整系統。
          </p>
          <div className="landing-entry-list" aria-label="今心入口">
            <span>網頁：今日心情、回顧、成長看板、阿念教練</span>
            <span>LINE：輸入「綁定」後，用聊天完成練習</span>
            <span>官方帳號：@980pqrhn</span>
          </div>
        </div>
        <figure className="landing-screen-panel">
          <img src="/landing/home-desktop-latest.png" alt="今心今日心情四色狀態入口" />
          <figcaption>打開後，先從今天最接近的感覺開始。</figcaption>
        </figure>
      </section>

      <section id="landing-coach" className="landing-band landing-coach" aria-labelledby="landing-coach-title">
        <figure className="landing-coach-visual">
          <img src="/landing/coach-desktop-latest.png" alt="今心阿念教練畫面" />
        </figure>
        <div className="landing-coach-copy">
          <p className="landing-kicker">阿念教練</p>
          <h2 id="landing-coach-title">不是等你把故事說完整，而是慢慢看懂你的節奏。</h2>
          <p>
            當你只說「我卡住了」或「我最近很焦慮」，阿念會依近期情緒線索與當下文字，幫你分辨要先聊、先記錄、先呼吸，還是先暫停。
          </p>
          <button type="button" className="landing-secondary" onClick={onCoach}>進入阿念教練</button>
        </div>
      </section>

      <section className="landing-band landing-map" aria-labelledby="landing-map-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">留下自己的脈絡</p>
          <h2 id="landing-map-title">每一次停下來，都會慢慢變成看得懂自己的線索。</h2>
        </div>
        <div className="landing-screen-row">
          <figure>
            <img src="/landing/history-desktop-latest.png" alt="今心記錄回顧畫面" />
            <figcaption>記錄回顧</figcaption>
          </figure>
          <figure>
            <img src="/landing/growth-desktop-latest.png" alt="今心成長看板畫面" />
            <figcaption>成長看板</figcaption>
          </figure>
        </div>
      </section>

      <section id="landing-safety" className="landing-band landing-safety" aria-labelledby="landing-safety-title">
        <div>
          <p className="landing-kicker">安心邊界</p>
          <h2 id="landing-safety-title">今心是陪你覺察的工具，不是心理治療或醫療建議。</h2>
        </div>
        <p>
          今心的設計受到情緒教育、心理彈性、內在部分與身心整合觀點啟發，但沒有任何機構官方授權或關係。若你正處於立即危險，請聯繫當地緊急服務或可信任的人。
        </p>
      </section>

      <section className="landing-final" aria-labelledby="landing-final-title">
        <img src="/logo.png" alt="" />
        <p className="landing-kicker">今心，即為念。</p>
        <h2 id="landing-final-title">它只是陪你在今天，好好回到此刻，陪伴自己的心。</h2>
        <button type="button" className="landing-primary" onClick={onStart}>開始今天練習</button>
      </section>
    </section>
  );
};

export default LandingPage;
