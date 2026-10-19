// The body of a single card: title, instructions and radio script/exchange.
// `detail` is course information; `note` is small print (source gaps, map caveats).
export default function CardView({ event }) {
  const radio = event.radio;

  return (
    <>
      <h2 className="guide-title">{event.title}</h2>
      {(event.leadIn || event.instructions?.length > 0 || event.prompt) && (
        <div className="event-instructions">
          {event.leadIn && <p className="instruction-lead-in">{event.leadIn}</p>}
          {event.instructions?.length > 0 && (
            <ul className="instruction-list">
              {event.instructions.map((instruction) => (
                <li key={instruction}>{instruction}</li>
              ))}
            </ul>
          )}
          {!event.instructions?.length && event.prompt && (
            <p className="guide-prompt">{event.prompt}</p>
          )}
        </div>
      )}
      {radio && (
        <div className="script-panel">
          <div className="script-heading">
            <span className="detail-label">
              {radio.exchange ? 'Exchange' : radio.script ? 'Say' : 'Radio'}
            </span>
            <span className="channel-label">{radio.channel}</span>
          </div>
          {radio.exchange ? (
            <div className="script-exchange">
              {radio.exchange.map(({ speaker, text }, index) => (
                <div
                  className={`script-exchange-line ${
                    speaker === 'Pilot' ? 'exchange-pilot' : 'exchange-other'
                  }`}
                  key={`${speaker}-${index}`}
                >
                  <span className="exchange-speaker">{speaker}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          ) : (
            radio.script && <p>{radio.script}</p>
          )}
        </div>
      )}
      {event.detail && <p className="event-info">{event.detail}</p>}
      {event.note && <p className="event-note">{event.note}</p>}
    </>
  );
}
