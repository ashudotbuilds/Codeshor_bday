export function Envelope({ opening = false, small = false }) {
  return <div className={'envelope-scene' + (opening ? ' opening' : '') + (small ? ' envelope-small' : '')} aria-hidden="true">
    <div className="orbit orbit-outer" /><div className="orbit orbit-inner" />
    <span className="spark spark-a">✦</span><span className="spark spark-b">✧</span>
    <span className="spark spark-c">✦</span><span className="spark spark-d">✧</span>
    <span className="spark spark-e">·</span>
    <div className="envelope">
      <div className="envelope-base" />
      <div className="envelope-letter"><span>FOR YOU,</span><strong>with love.</strong><i>✦</i></div>
      <div className="envelope-pocket" />
      <div className="envelope-wing" />
      <div className="envelope-flap" />
      <div className="envelope-seal">✹</div>
    </div>
  </div>;
}

export function StageLabel({ children, ink = false }) {
  return <p className={'stage-label' + (ink ? ' stage-label-ink' : '')}><span aria-hidden="true">✦</span>{children}</p>;
}

export function CelebrationBurst() {
  return <div className="celebration-burst" aria-hidden="true">{Array.from({length: 14}, (_, index) =>
    <i key={index} style={{'--angle': index * 25.71 + 'deg', '--delay': (index % 4) * 32 + 'ms'}} />)}</div>;
}
