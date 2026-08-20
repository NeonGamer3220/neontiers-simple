export default function Loading() {
  return (
    <div className="loadingPage">
      <div className="loadingNavbar">
        <div className="loadingNavInner">
          <div className="loadingLogo">NeonTiers</div>
          <div className="loadingNavLinks">
            <span className="loadingPulse loadingNavLink" />
            <span className="loadingPulse loadingNavLink" />
            <span className="loadingPulse loadingNavLink" />
          </div>
        </div>
      </div>

      <div className="loadingTabs">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="loadingPulse loadingTab" />
        ))}
      </div>

      <div className="loadingBoard">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="loadingRow">
            <span className="loadingPulse loadingRowNum" />
            <span className="loadingPulse loadingRowSkin" />
            <span className="loadingRowText">
              <span className="loadingPulse loadingRowName" />
              <span className="loadingPulse loadingRowPoints" />
            </span>
            <span className="loadingRowBadges">
              <span className="loadingPulse loadingBadge" />
              <span className="loadingPulse loadingBadge" />
              <span className="loadingPulse loadingBadge" />
            </span>
          </div>
        ))}
      </div>

      <style>{`
        .loadingPage {
          min-height: 100vh;
          background: #0b0e14;
          padding: 0 20px;
        }

        .loadingNavbar {
          max-width: 1480px;
          margin: 0 auto;
          padding-top: 24px;
        }

        .loadingNavInner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: #0b0d11f5;
          border: 1px solid #ffffff14;
          border-radius: 18px;
        }

        .loadingLogo {
          font-family: Montserrat, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.04em;
          color: #fffffff0;
        }

        .loadingNavLinks {
          display: flex;
          gap: 10px;
        }

        .loadingNavLink {
          width: 84px;
          height: 32px;
          border-radius: 8px;
        }

        .loadingTabs {
          max-width: 1480px;
          margin: 30px auto 0;
          display: flex;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
          padding: 0 20px 20px;
        }

        .loadingTab {
          width: 78px;
          height: 58px;
          border-radius: 14px 14px 0 0;
        }

        .loadingBoard {
          max-width: 1480px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 0 20px 40px;
        }

        .loadingRow {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          background: #0b0d11f5;
          border: 1px solid #ffffff14;
          border-radius: 16px;
        }

        .loadingRowNum {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .loadingRowSkin {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .loadingRowText {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .loadingRowName {
          width: 40%;
          max-width: 180px;
          height: 14px;
          border-radius: 6px;
        }

        .loadingRowPoints {
          width: 25%;
          max-width: 90px;
          height: 11px;
          border-radius: 6px;
        }

        .loadingRowBadges {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .loadingBadge {
          width: 34px;
          height: 34px;
          border-radius: 10px;
        }

        .loadingPulse {
          display: inline-block;
          background: linear-gradient(90deg, #ffffff0f 25%, #ffffff1c 37%, #ffffff0f 63%);
          background-size: 400% 100%;
          animation: loadingShimmer 1.4s ease infinite;
        }

        @keyframes loadingShimmer {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }

        @media (max-width: 640px) {
          .loadingNavLinks { display: none; }
          .loadingRowBadges { display: none; }
        }
      `}</style>
    </div>
  );
}
