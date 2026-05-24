import styles from './Legend.module.css'

const ITEMS = [
  { group: 'dash-em',    label: 'Длинное тире',       symbol: '—',        bg: 'rgba(0,89,214,0.2)',    border: '#0059d6' },
  { group: 'dash-en',    label: 'Короткое тире',      symbol: '–',        bg: 'rgba(53,136,253,0.2)',  border: '#3588fd' },
  { group: 'quotes',     label: 'Кавычки',            symbol: '« » „ "',  bg: 'rgba(239,167,1,0.2)',   border: '#efa701' },
  { group: 'nbsp',       label: 'Неразрывный пробел', symbol: 'U+00A0',   bg: 'rgba(27,161,54,0.2)',   border: '#1ba136' },
  { group: 'zero-width', label: 'Word Joiner',         symbol: 'U+2060',   bg: 'rgba(238,93,231,0.2)',  border: '#ee5de7' },
]

export default function Legend({ onClose }) {
  return (
    <div className={styles.panel} role="dialog" aria-label="Легенда">
      {ITEMS.map(item => (
        <div key={item.group} className={styles.row}>
          <div className={styles.rowLeft}>
            <span
              className={styles.swatch}
              style={{ background: item.bg, borderColor: item.border }}
            />
            <span className={styles.name}>{item.label}</span>
          </div>
          <span className={styles.symbol}>{item.symbol}</span>
        </div>
      ))}
    </div>
  )
}
