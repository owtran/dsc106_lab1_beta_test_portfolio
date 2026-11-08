import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  return data;
}

let data = await loadData();

function processCommits(data) {
  return d3.groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/owtran/dsc106_lab1_beta_test_portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        writable: false,
        configurable: false,
      });

      return ret;
    });
}

let commits = processCommits(data);
console.log(commits);

/*
What changed: Each commit now has its author, date, time, and line count. hourFrac converts a time like 2:30 PM → 14.5, which we’ll use to position dots.
*/

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats')
    .append('dl')
    .attr('class', 'stats');

  dl.append('dt').text('Total lines');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.group(data, d => d.file).size);

  dl.append('dt').text('Longest line (characters)');
  dl.append('dd').text(d3.max(data, d => d.length));

  dl.append('dt').text('Average line length (characters)');
  dl.append('dd').text(d3.mean(data, d => d.length).toFixed(1));
}

renderCommitInfo(data, commits);


function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;

  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  const margin = { top: 10, right: 10, bottom: 30, left: 20 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Gridlines go before axes and dots.
  const gridlines = svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

  gridlines.call(
    d3.axisLeft(yScale)
      .tickFormat('')
      .tickSize(-usableArea.width)
  );

  const xAxis = d3.axisBottom(xScale);

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => String(d % 24).padStart(2, '0') + ':00');

  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    const [minLines, maxLines] = d3.extent(
    commits,
    d => d.totalLines
  );

  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);

  const sortedCommits = d3.sort(commits, d => -d.totalLines);
    
  const dots = svg.append('g')
    .attr('class', 'dots');

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
   .style('fill-opacity', 0.7)
    .attr('fill', 'steelblue')

  .on('mouseenter', (event, commit) => {
  d3.select(event.currentTarget).style('fill-opacity', 1);
  renderTooltipContent(commit);
  updateTooltipVisibility(true);
  updateTooltipPosition(event);
  })
  .on('mouseleave', (event) => {
    d3.select(event.currentTarget).style('fill-opacity', 0.7);
    updateTooltipVisibility(false);
  });
createBrushSelector(svg, xScale, yScale);

    }
renderScatterPlot(data, commits);

/*
Left/right = date. Up/down = time of day.
*/




function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');

  link.href = commit.url;
  link.textContent = commit.id.slice(0, 7);

  document.getElementById('commit-date').textContent =
    commit.datetime.toLocaleDateString();

  document.getElementById('commit-time').textContent =
    commit.datetime.toLocaleTimeString();

  document.getElementById('commit-author').textContent =
    commit.author;

  document.getElementById('commit-lines').textContent =
    commit.totalLines;
}



function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}


function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
}

function createBrushSelector(svg, xScale, yScale) {
  function isCommitSelected(selection, commit) {
    if (!selection) return false;

    const [[x0, y0], [x1, y1]] = selection;
    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  }

  function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  document.getElementById('selection-count').textContent =
    `${selectedCommits.length || 'No'} commits selected`;

  return selectedCommits;
}

  function renderLanguageBreakdown(selectedCommits) {
  const container = d3.select('#language-breakdown');
  container.html('');

  if (selectedCommits.length === 0) return;

  const lines = selectedCommits.flatMap(d => d.lines);

  const breakdown = d3.rollup(
    lines,
    group => group.length,
    d => d.type
  );

  for (const [language, count] of breakdown) {
    container.append('dt').text(language);
    container.append('dd').text(
      `${count} lines (${d3.format('.1~%')(count / lines.length)})`
    );
  }
}

  function brushed(event) {
  svg.selectAll('.dots circle')
    .classed('selected', d =>
      isCommitSelected(event.selection, d)
    );

  const selectedCommits = renderSelectionCount(event.selection);
  renderLanguageBreakdown(selectedCommits);
}

  svg.call(d3.brush().on('start brush end', brushed));

  svg.selectAll('.dots, .overlay ~ *').raise();
}