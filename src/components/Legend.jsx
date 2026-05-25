import styles from './Legend.module.css'

const ITEMS = [
  { group: 'dash-em',    label: 'Длинное тире',       symbol: '—',        bg: 'rgba(0,89,214,0.30)'   },
  { group: 'dash-en',    label: 'Короткое тире',      symbol: '–',        bg: 'rgba(53,136,253,0.30)' },
  { group: 'quotes',     label: 'Кавычки',            symbol: '« » „ "',  bg: 'rgba(239,167,1,0.30)'  },
  { group: 'nbsp',       label: 'Неразрывный пробел', symbol: 'U+00A0',   bg: 'rgba(27,161,54,0.30)'  },
  { group: 'zero-width', label: 'Word Joiner',        symbol: 'U+2060',   bg: 'rgba(238,93,231,0.30)' },
]

export default function Legend({ onClose }) {
  return (
    <div className={styles.panel} role="dialog" aria-label="Легенда">
      {ITEMS.map(item => (
        <div key={item.group} className={styles.row}>
          <div className={styles.rowLeft}>
            <span
              className={styles.swatch}
              style={{ background: item.bg, borderColor: 'transparent' }}
            />
            <span className={styles.name}>{item.label}</span>
          </div>
          <span className={styles.symbol}>{item.symbol}</span>
        </div>
      ))}
    </div>
  )
}
