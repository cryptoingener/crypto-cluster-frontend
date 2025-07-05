import React, { useEffect, useState } from "react";

// Для работы с backend через WebSocket:
const WS_BACKEND =
  process.env.REACT_APP_WS_BACKEND ||
  "wss://crypto-cluster-backend.onrender.com";

// Простая обработка WebSocket
function useMarketData() {
  const [data, setData] = useState({});
  useEffect(() => {
    const ws = new window.WebSocket(WS_BACKEND);
    ws.onmessage = (e) => setData(JSON.parse(e.data));
    return () => ws.close();
  }, []);
  return data;
}

function App() {
  const data = useMarketData();
  const [selected, setSelected] = useState(null);

  if (!Object.keys(data).length) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1b1b2b 0%, #242448 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2rem"
        }}
      >
        Загружаем live-кластеры Binance...
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "monospace", minHeight: "100vh", background: "#1a1831", color: "#fff" }}>
      <header style={{ padding: 24, borderBottom: "1px solid #2a2240" }}>
        <span style={{ fontSize: 32, fontWeight: "bold", color: "#ff00e7", letterSpacing: 2 }}>
          CRYPTO CLUSTER LIVE
        </span>
      </header>
      {!selected ? (
        <Heatmap data={data} onSelect={setSelected} />
      ) : (
        <Instrument symbol={selected} data={data[selected]} onBack={() => setSelected(null)} />
      )}
      <footer style={{ marginTop: 50, padding: 16, color: "#aaa", fontSize: 12, textAlign: "center" }}>
        Powered by Render & ChatGPT • Live Binance USDT Clusters
      </footer>
    </div>
  );
}

// HEATMAP компонент
function Heatmap({ data, onSelect }) {
  return (
    <div style={{ maxWidth: 1100, margin: "32px auto" }}>
      <h2 style={{ fontSize: 28, marginBottom: 18, color: "#e1baff" }}>Тепловая карта Binance (кластеры)</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 18 }}>
        {Object.entries(data).map(([symbol, d]) => (
          <button
            key={symbol}
            onClick={() => onSelect(symbol)}
            style={{
              background: "#252049",
              borderRadius: 16,
              border: d.heat > 0.7 ? "2.5px solid #db2777" : "2px solid #292248",
              padding: 18,
              minHeight: 88,
              cursor: "pointer",
              boxShadow: d.heat > 0.9
                ? "0 0 16px #ff00e7bb"
                : d.heat > 0.7
                ? "0 0 12px #db2777bb"
                : "0 0 4px #3b82f6aa"
            }}
          >
            <span style={{ fontWeight: "bold", fontSize: 22, color: d.heat > 0.7 ? "#db2777" : "#60a5fa" }}>
              {symbol}
            </span>
            <div
              style={{
                marginTop: 10,
                width: "80%",
                height: 6,
                borderRadius: 6,
                background: `linear-gradient(90deg, #373793 ${d.heat * 100}%, #ff00e7 ${(d.heat * 100).toFixed(0)}%)`
              }}
            />
            <span style={{ marginTop: 8, fontSize: 12, color: "#db2777" }}>
              Heat: {(d.heat * 100).toFixed(0)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Страница инструмента (кластерный график + tape + заметки)
function Instrument({ symbol, data, onBack }) {
  return (
    <div style={{ maxWidth: 1100, margin: "24px auto" }}>
      <button
        style={{
          marginBottom: 24,
          background: "#232357",
          color: "#db2777",
          padding: "8px 24px",
          borderRadius: 10,
          border: "none",
          fontWeight: "bold",
          cursor: "pointer"
        }}
        onClick={onBack}
      >
        ← Назад к рынку
      </button>
      <h2 style={{ fontSize: 26, fontWeight: "bold", color: "#ff00e7", marginBottom: 8 }}>{symbol}</h2>
      <div>
        <ClusterGraph clusters={data?.clusters || []} />
        <TapeList tape={data?.tape || []} />
      </div>
    </div>
  );
}

// График кластеров
function ClusterGraph({ clusters }) {
  const maxVol = Math.max(...clusters.map((c) => c.total));
  return (
    <div style={{ background: "#232357", borderRadius: 16, boxShadow: "0 0 12px #17174444", padding: 20, marginBottom: 24 }}>
      <div style={{ fontWeight: "bold", color: "#e9d5ff", marginBottom: 10 }}>Кластерный график (1м)</div>
      <div style={{ display: "flex", alignItems: "end", gap: 10, minHeight: 130 }}>
        {clusters.map((c, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 1 }}>
              {Object.entries(c.bins || {}).map(([bin, vol], j) => (
                <div
                  key={j}
                  style={{
                    width: 9,
                    height: `${(vol / (Math.max(...Object.values(c.bins)) || 1)) * 90 + 8}px`,
                    borderRadius: 6,
                    background: vol === Math.max(...Object.values(c.bins))
                      ? "linear-gradient(180deg,#ff00e7 40%,#db2777 100%)"
                      : "linear-gradient(180deg,#60a5fa 20%,#373793 90%)",
                    boxShadow: vol === Math.max(...Object.values(c.bins))
                      ? "0 0 14px #ff00e7cc"
                      : "0 0 2px #60a5fa88"
                  }}
                  title={`Цена: ${bin}, Объём: ${vol.toFixed(3)}`}
                />
              ))}
            </div>
            <div style={{ fontSize: 11, marginTop: 3, color: "#e9d5ff" }}>
              {new Date(c.start).toLocaleTimeString().slice(0,5)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Лента
function TapeList({ tape }) {
  return (
    <div style={{ background: "#18182c", borderRadius: 12, boxShadow: "0 0 6px #17174444", padding: 16, minHeight: 90 }}>
      <div style={{ fontWeight: "bold", color: "#f7e2ff", marginBottom: 5 }}>Лента сделок (последние)</div>
      <table style={{ width: "100%", fontSize: 13 }}>
        <thead>
          <tr style={{ color: "#a5b4fc", textAlign: "left" }}>
            <th>Время</th>
            <th>Цена</th>
            <th>Объём</th>
            <th>Тип</th>
          </tr>
        </thead>
        <tbody>
          {tape?.slice(-12).map((t, i) => (
            <tr key={i} style={{ background: t.side === "BUY" ? "#16f9d218" : "#db277718" }}>
              <td>{t.time}</td>
              <td>{t.price}</td>
              <td>{t.volume}</td>
              <td style={{ fontWeight: "bold", color: t.side === "BUY" ? "#16f9d2" : "#db2777" }}>
                {t.side}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
