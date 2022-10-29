import styles from '../styles/Home.module.css'
import dynamic from 'next/dynamic';

const Canvas = dynamic(
  () => import('../components/canvas'),
  { ssr: false }
)

export default function Home() {
  return (
    <div className={styles.container}>
      <Canvas />
    </div>
  )
}
