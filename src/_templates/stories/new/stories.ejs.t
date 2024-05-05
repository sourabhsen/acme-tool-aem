---
to: stories/<%- folderName %>/<%= name %>.stories.js
unless_exists: true
---
import <%=name%>Policy from '../../storybook-assets<%= policiesPath%>/<%= name %>.json'

export default {
  title: '<%- folderName %>/<%= Name %>',
   tags: ['autodocs'],
  decorators: [

  ],
  parameters: {
    myAddonParameter: {
      policy: <%=name%>Policy
    }
  }
};


window.addEventListener('message', (detail) => {
  const detailsObj = detail?.data || {};
  const eventType = JSON.parse(detailsObj).event?.type;
  const val = JSON.parse(detailsObj).event;
  if(eventType === 'storybook/style-system/change') {
    console.log('sourabh-qq-', val.args[0].selectedStyle);
  }
}); 
