import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import Landing from './pages/Landing'

// ponytail: only the public marketing page is prerendered (it's pure static).
// App routes stay client-rendered behind auth.
export function render(): string {
  return renderToString(
    <StaticRouter location="/">
      <div className="min-h-screen bg-forge-bg text-forge-text">
        <Landing />
      </div>
    </StaticRouter>,
  )
}
