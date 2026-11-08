// Import D3 and our project helper functions.
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

// Load projects and find page elements.
const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');
const searchInput = document.querySelector('.searchBar');

// FIX: Remember BOTH filters outside the chart function.
let query = '';
let selectedYear = null;

// Keep each year's color consistent.
const colors = d3.scaleOrdinal(d3.schemeTableau10)
  .domain([...new Set(projects.map((p) => String(p.year)))]);

// FIX: Both event handlers use this function.
function updateProjects() {
  // First, find projects matching the search.
  let searchResults = projects.filter((project) => {
    return Object.values(project)
      .join('\n')
      .toLowerCase()
      .includes(query.toLowerCase());
  });

  // Then filter those search results by the selected year.
  let filteredProjects = searchResults.filter((project) => {
    return selectedYear === null ||
      String(project.year) === selectedYear;
  });

  // Display projects matching BOTH filters.
  renderProjects(filteredProjects, projectsContainer, 'h2');
  projectsTitle.textContent = `Projects (${filteredProjects.length})`;

  // Show available years within the search results.
  renderPieChart(searchResults);
}

// Draw the pie chart and legend.
function renderPieChart(projectsGiven) {
  // Count projects in each year.
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  let data = rolledData.map(([year, count]) => ({
    label: String(year),
    value: count,
  }));

  // Calculate the slice shapes.
  let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);

  let svg = d3.select('#projects-pie-plot');
  let legend = d3.select('.legend');

  // Clear the previous chart and legend.
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  // Draw each slice.
  arcData.forEach((slice) => {
    let year = slice.data.label;

    svg
      .append('path')
      .attr('d', arcGenerator(slice))
      .attr('fill', colors(year))
      .classed('selected', year === selectedYear)

      // SLICE-CLICK HANDLER
      .on('click', () => {
        // Select or deselect this year.
        selectedYear = selectedYear === year ? null : year;

        // FIX: Apply BOTH filters.
        updateProjects();
      });
  });

  // Draw and highlight the legend entries.
  data.forEach((d) => {
    legend
      .append('li')
      .attr('class', 'legend-item')
      .classed('selected', d.label === selectedYear)
      .attr('style', `--color: ${colors(d.label)}`)
      .html(
        `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`
      );
  });
}

// SEARCH HANDLER
searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  // FIX: Apply BOTH filters.
  updateProjects();
});

// Display everything when the page loads.
updateProjects();








/*
Lab 5 
Jscript draws pie plot:
    arcGenerator: creates the shape’s drawing instructions.
    0 to 2 * Math.PI: a full circle.
    .append('path'): adds that shape to your SVG. 
*/


/*
Project	Year
Basketball Data	2026
Basketball Stats	2025
Cooking Website	2026

You search “Basketball.” You want only basketball projects.
Then you click the 2026 slice. You want to narrow those results to basketball projects from 2026.

✅ Correct: Basketball Data only.
❌ The old bug: Basketball Data and Cooking Website appeared. Clicking the year forgot your search and showed everything from 2026.

We want both of the filters to stay active!! 


Problem: Searching and clicking a slice ignored each other’s filter.
Change: Both handlers now call updateProjects().
Fix: It filters by search first, then by year.
Result: Projects must match both.



Before: Clicking a slice filtered all projects, ignoring the search.
let filteredProjects = projects.filter((project) => {
  return String(project.year) === selectedYear;
});

renderProjects(filteredProjects, projectsContainer, 'h2');

After: Clicking a slice calls our shared function:
selectedYear = selectedYear === year ? null : year;
updateProjects();

Inside updateProjects(), we filter the search results by year:
let filteredProjects = searchResults.filter((project) => {
  return selectedYear === null ||
    String(project.year) === selectedYear;
});

Main change: projects.filter(...) → searchResults.filter(...). This keeps the search active when you select a year.
*/


