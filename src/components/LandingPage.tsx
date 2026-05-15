import './LandingPage.css';

interface LandingPageProps {
  onStart: () => void;
  onCoach: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onCoach }) => {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="landing-title">
        <header className="landing-nav" aria-label="今心官網導覽">
          <a className="landing-brand" href="#landing" aria-label="今心首頁">
            <img src="/logo.png" alt="" />
            <span>今心</span>
          </a>
          <div className="landing-nav-actions">
            <a href="#coach">主動教練</a>
            <a href="#how">怎麼開始</a>
            <a href="#safety">安心使用</a>
            <button type="button" onClick={onStart}>開始整理</button>
          </div>
        </header>

        <div className="landing-hero-copy">
          <p className="landing-kicker">會主動接住下一步的情緒陪伴</p>
          <h1 id="landing-title">今心主動情緒教練</h1>
          <p className="landing-hero-statement">不是等你整理好，才開始陪你。</p>
          <p className="landing-lead">
            先用四色狀態看見此刻，再由主動教練接續你的記錄、LINE 片段與當下訊息，陪你判斷現在最適合聊天、記錄、呼吸，還是先暫停。
          </p>
          <div className="landing-hero-actions">
            <button type="button" className="landing-primary" onClick={onStart}>開始整理</button>
            <button type="button" className="landing-secondary" onClick={onCoach}>看教練怎麼陪</button>
          </div>
        </div>

        <figure className="landing-hero-product">
          <img src="/landing/home-desktop-latest.png" alt="今心最新版四色狀態首頁畫面" />
          <figcaption>最新版首頁：四色狀態入口、右上角工具與主動教練浮動入口</figcaption>
        </figure>
      </section>

      <section id="why" className="landing-band landing-problem" aria-labelledby="landing-why-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">不是另一個打卡工具</p>
          <h2 id="landing-why-title">今心把「我說不清楚」變成可以開始的一小步。</h2>
        </div>
        <div className="landing-insight-row">
          <article>
            <span>01</span>
            <h3>先看見現在</h3>
            <p>用能量與心情的四個位置，讓模糊的感覺先有地方放。</p>
          </article>
          <article>
            <span>02</span>
            <h3>接續你的脈絡</h3>
            <p>主動教練會參考最近線索，不只回應單一句話。</p>
          </article>
          <article>
            <span>03</span>
            <h3>推一個小步</h3>
            <p>聊天、記錄、呼吸、回顧或先暫停，讓下一步真的可行。</p>
          </article>
        </div>
      </section>

      <section id="how" className="landing-band landing-flow" aria-labelledby="landing-how-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">怎麼開始</p>
          <h2 id="landing-how-title">首頁只留下最重要的開始：選一個最接近現在的色塊。</h2>
        </div>
        <div className="landing-flow-grid">
          <div className="landing-flow-copy">
            <div className="landing-step">
              <strong>心照</strong>
              <p>心照一念，選一個最接近現在能量與心情的位置。</p>
            </div>
            <div className="landing-step">
              <strong>喚名</strong>
              <p>喚其真名，把「有點怪」慢慢靠近成更準確的感覺。</p>
            </div>
            <div className="landing-step">
              <strong>安神</strong>
              <p>安住心神，把感覺和需要放到安全的位置。</p>
            </div>
            <div className="landing-step">
              <strong>動念</strong>
              <p>一念可轉，留下一個能真的開始的小行動。</p>
            </div>
          </div>
          <figure className="landing-screen-panel">
            <img src="/landing/home-desktop-latest.png" alt="今心四色狀態心情選擇畫面" />
          </figure>
        </div>
      </section>

      <section id="coach" className="landing-band landing-coach" aria-labelledby="landing-coach-title">
        <div className="landing-coach-visual">
          <img src="/landing/coach-desktop-latest.png" alt="今心主動教練畫面" />
        </div>
        <div className="landing-coach-copy">
          <p className="landing-kicker">主動型教練</p>
          <h2 id="landing-coach-title">它不是等你下指令，而是主動判斷現在該怎麼陪。</h2>
          <p>
            當你只留下一句「我卡住了」，今心會依你的近期情緒、互動與當下文字，幫你分辨要先聊、先記錄、先呼吸，或打開緊急安定練習。
          </p>
          <button type="button" className="landing-secondary" onClick={onCoach}>進入教練</button>
        </div>
      </section>

      <section className="landing-band landing-map" aria-labelledby="landing-map-title">
        <div className="landing-section-heading">
          <p className="landing-kicker">慢慢看見自己的變化</p>
          <h2 id="landing-map-title">每一次停下來，都會變成你自己的情緒地圖。</h2>
        </div>
        <div className="landing-screen-row">
          <figure>
            <img src="/landing/history-desktop-latest.png" alt="記錄回顧畫面" />
            <figcaption>記錄回顧</figcaption>
          </figure>
          <figure>
            <img src="/landing/growth-desktop-latest.png" alt="成長看板畫面" />
            <figcaption>成長看板</figcaption>
          </figure>
        </div>
      </section>

      <section id="safety" className="landing-band landing-safety" aria-labelledby="landing-safety-title">
        <div>
          <p className="landing-kicker">安心使用</p>
          <h2 id="landing-safety-title">今心是陪你覺察的工具，不是用來評分你的工具。</h2>
        </div>
        <p>
          你的記錄是為了幫你回看脈絡、整理下一步。今心不取代專業醫療、心理治療或緊急協助；若你正處於立即危險，請聯繫當地緊急服務或可信任的人。
        </p>
      </section>

      <section className="landing-final" aria-labelledby="landing-final-title">
        <img src="/logo.png" alt="" />
        <p className="landing-kicker">今天，先看見自己的心。</p>
        <h2 id="landing-final-title">從一個最接近的感覺開始。</h2>
        <button type="button" className="landing-primary" onClick={onStart}>開始整理</button>
      </section>
    </main>
  );
};

export default LandingPage;
