import 'babel-polyfill'
import * as d3 from 'd3'

main()

async function main () {
  const { baseTemperature, monthlyVariance: data } = await d3.json('https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json')
  console.log(baseTemperature, data)

  const width = 1400,
        height = 480,
        paddingV = 40,
        paddingH = 100,
        color = ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"].reverse()

  const svg = d3
    .select('#root')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const minYear = d3.min(data, d => d.year)
  const maxYear = d3.max(data, d => d.year)
  const x = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([paddingH, width - paddingH])
  
  const xAxis = d3
    .axisBottom(x)

  svg
    .append('g')
    .attr('transform', `translate(0, ${height - paddingV})`)
    .call(xAxis)

  const y = d3
    .scaleLinear()
    .domain([1, 12])
    .range([paddingV, height - paddingV])

  const yAxis = d3
    .axisLeft(y)
    .tickFormat((month) => {
      const date = new Date(0);
      date.setUTCMonth(month - 1);
      return d3.utcFormat("%B")(date)
    })
  
  const variance = data.map(i => i.variance)
  const minTemp = baseTemperature + Math.min(...variance)
  const maxTemp = baseTemperature + Math.max(...variance)
  const legendScaleDomain = ((min, max, count) => {
    const step = (max - min) / count
    const arr = []
    for (let i = 0; i < count; i++) {
      arr.push(min + i * step)
    }
    return arr
  })(minTemp, maxTemp, color.length)
  
  const legendScale = d3
    .scaleThreshold()
    .domain(legendScaleDomain)
    .range(color)

  svg
    .append('g')
    .attr('transform', `translate(${paddingH}, 0)`)
    .call(yAxis)

  const cellWidth = (width - paddingH * 2) / Math.ceil((data.length) / 12)
  const cellHeight = (height - paddingV * 2) / 12
  svg
    .append('g')
    .selectAll('.cell')
    .data(data)
    .enter()
    .append('rect')
    .attr('width', d => cellWidth)
    .attr('height', d => cellHeight)
    .attr('x', d => cellWidth * (d.year - minYear) + paddingH)
    .attr('y', d => paddingV + (d.month - 1) * cellHeight)
    .style('fill', d => legendScale(d.variance + baseTemperature))
}