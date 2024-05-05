---
to: stories/<%- folderName %>/<%= name %>.stories.js
unless_exists: true
---
<% if (policyExists === 'true') { %>
import <%= name %>Policy from '<%= '../../storybook-assets' + policiesPath + '/' + name + '.json' %>';
<% } %>

export default {
  title: '<%= folderName %>/<%= Name %>',
  tags: ['autodocs'],
  decorators: [],
  parameters: { <% if (policyExists === 'true') { %>
    myAddonParameter: {
      policy: <%= name %>Policy
    } <% } %>
  }
};

window.addEventListener('message', (detail) => {
  const detailsObj = detail?.data || {};
  const eventType = JSON.parse(detailsObj).event?.type;
  
  if (eventType === 'storybook/style-system/change') {
    const val = JSON.parse(detailsObj).event;
    const styleClasses = val.args[0].selectedStyle;
    const getHtml = document.querySelector('#storybook-root');
    const isWrapper = document.querySelector('#storybook-root .sb-wrapper');
    
    const updatedHTML = `<div class="sb-wrapper ${styleClasses}">${getHtml.innerHTML}</div>`;
    
    if (isWrapper) {
      document.querySelector('#storybook-root .sb-wrapper').classList.forEach(className => {
        if (className !== 'sb-wrapper') {
          document.querySelector('#storybook-root .sb-wrapper').classList.remove(className);
        }
      });
      document.querySelector('#storybook-root .sb-wrapper').classList.add(styleClasses);
    } else {
      getHtml.innerHTML = updatedHTML;
    }
  }
});
