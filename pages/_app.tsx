import 'normalize.css/normalize.css'
import 'reset-css/reset.css'
import '../styles/globals.scss'
import type { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
