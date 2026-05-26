import styles from './Toggle.module.css'

export default function Toggle({ active, label, onClick, ariaLabel }) {
  return (
    <button className={styles.row} onClick={onClick} aria-label={ariaLabel}>
      <div className={`${styles.track} ${active ? styles.on : ''}`}>
        <div className={styles.thumb} />
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </button>
  )
}
