import { textSummary } from './k6-summary.js'
import { getEnv, getEnvBool } from './config.js'

// 生成 k6 summary 回调，用于输出 stdout 文本 + JSON summary + HTML 报告
export function generateSummary(desc) {
  return (data) => {
    const result = {
      stdout:
        '\n\n' +
        textSummary(data, {
          indent: ' ',
          enableColors: getEnvBool('K6_ENABLE_COLORS', 'true'),
        }) +
        '\n\n',
    }

    const metric = 'iteration_duration{scenario:default}'
    const successMetric = data.metrics.success
    const iterationsMetric = data.metrics.iterations

    // 从环境变量中拿 TEST_TYPE / VUS / Iterations，作为报告和文件名的唯一来源
    const testType = getEnv('TEST_TYPE', 'default')
    const vus = getEnv('HARBOR_VUS', getEnv('VUS', getEnv('K6_VUS', 'N/A')))
    const totalIterations = getEnv(
      'HARBOR_ITERATIONS',
      String(iterationsMetric.values.count || '')
    )

    const summary = {
      timestamp: Date.now(),
      description: desc,
      testType,
      vus,
      // 保持为字符串，方便后处理
      totalIterations,
      avg: toHumanSeconds(data.metrics[metric].values.avg),
      min: toHumanSeconds(data.metrics[metric].values.min),
      med: toHumanSeconds(data.metrics[metric].values.med),
      max: toHumanSeconds(data.metrics[metric].values.max),
      p90: toHumanSeconds(data.metrics[metric].values['p(90)']),
      p95: toHumanSeconds(data.metrics[metric].values['p(95)']),
      successRate: toHumanRate(successMetric.values.rate),
      iterationsRate: `${iterationsMetric.values.rate.toFixed(2)}/s`,
    }

    const baseName = buildBaseName(desc, { testType, vus, totalIterations })

    if (getEnvBool('HARBOR_REPORT', 'false')) {
      const filename = `./outputs/${baseName}.summary.json`
      result[filename] = JSON.stringify(summary)
    }

    if (getEnvBool('HARBOR_HTML_REPORT', 'false')) {
      const htmlFilename = `./outputs/${baseName}.report.html`
      result[htmlFilename] = generateHTMLReport(summary)
    }

    return result
  }
}

function buildBaseName(desc, { testType, vus, totalIterations }) {
  const safeDesc = sanitize(desc)
  const parts = [safeDesc]

  if (testType) {
    parts.push(`type-${sanitize(testType)}`)
  }
  if (vus && vus !== 'N/A') {
    parts.push(`vus-${sanitize(String(vus))}`)
  }
  if (totalIterations != null) {
    parts.push(`iter-${sanitize(String(totalIterations))}`)
  }

  return parts.join('_')
}

function sanitize(str) {
  return String(str)
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
}

function toHumanSeconds(millseconds) {
  if (millseconds < 1000) {
    const v = Math.floor(millseconds * 100) / 100
    return `${v}ms`
  }

  const seconds = Math.floor((millseconds / 1000) * 100) / 100
  return `${seconds}s`
}

function toHumanRate(rate) {
  const rat = Math.floor(rate * 100 * 100) / 100
  return `${rat}%`
}

// 生成 HTML 报告内容（单个用例）
function generateHTMLReport(summary) {
  const {
    description,
    timestamp,
    testType,
    vus,
    totalIterations,
    avg,
    min,
    med,
    max,
    p90,
    p95,
    successRate,
    iterationsRate,
  } = summary

  const successNum = parseFloat(successRate) || 0

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harbor Performance Test Report - ${description}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      font-size: 2em;
      margin-bottom: 10px;
    }
    .header .subtitle {
      font-size: 1.1em;
      opacity: 0.9;
    }
    .header .timestamp {
      margin-top: 10px;
      font-size: 0.9em;
      opacity: 0.8;
    }
    .content {
      padding: 30px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border-left: 4px solid #667eea;
    }
    .metric-card.success {
      border-left-color: #28a745;
    }
    .metric-card.warning {
      border-left-color: #ffc107;
    }
    .metric-card.danger {
      border-left-color: #dc3545;
    }
    .metric-label {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .metric-value {
      font-size: 1.8em;
      font-weight: bold;
      color: #333;
    }
    .table-section {
      margin-top: 30px;
    }
    .table-section h2 {
      margin-bottom: 15px;
      color: #333;
      font-size: 1.5em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    thead {
      background: #667eea;
      color: white;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
    }
    th {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.85em;
      letter-spacing: 0.5px;
    }
    tbody tr {
      border-bottom: 1px solid #eee;
    }
    tbody tr:hover {
      background: #f8f9fa;
    }
    tbody tr:last-child {
      border-bottom: none;
    }
    .footer {
      padding: 20px 30px;
      background: #f8f9fa;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Harbor Performance Test Report</h1>
      <div class="subtitle">${description}</div>
      <div class="timestamp">Generated at: ${new Date(timestamp).toISOString()}</div>
    </div>
    <div class="content">
      <div class="metrics-grid">
        <div class="metric-card ${
          successNum >= 95 ? 'success' : successNum >= 80 ? 'warning' : 'danger'
        }">
          <div class="metric-label">Success Rate</div>
          <div class="metric-value">${successRate}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Test Type</div>
          <div class="metric-value">${testType}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">VUs</div>
          <div class="metric-value">${vus}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Total Iterations</div>
          <div class="metric-value">${totalIterations}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Iterations Rate</div>
          <div class="metric-value">${iterationsRate}</div>
        </div>
      </div>

      <div class="table-section">
        <h2>Response Time Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Average</strong></td>
              <td>${avg}</td>
            </tr>
            <tr>
              <td><strong>Minimum</strong></td>
              <td>${min}</td>
            </tr>
            <tr>
              <td><strong>Median</strong></td>
              <td>${med}</td>
            </tr>
            <tr>
              <td><strong>Maximum</strong></td>
              <td>${max}</td>
            </tr>
            <tr>
              <td><strong>P90</strong></td>
              <td>${p90}</td>
            </tr>
            <tr>
              <td><strong>P95</strong></td>
              <td>${p95}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="footer">
      Generated by Harbor Performance Testing Framework
    </div>
  </div>
</body>
</html>`
}

