---
inject: true
to: stories/<%=name%>.stories.js
append: true
skip_if: "name: '<%= storyName %>'"
---
<%
    const path = funcName + '_TemplatePath'
%>
// Start of story
import <%= path %> from '../storybook-assets<%= templatePath %>';

export const <%= storyName.split(' ').join('') %> = () => `${<%= path %>}`

<%= storyName.split(' ').join('') %>.story = {
  name: '<%= storyName %>',
  parameters: {
    design: {
      
    }
  }
};

// End of story

window.addEventListener('message', (detail) => {
  const detailsObj = detail?.data || {};
  const eventType = JSON.parse(detailsObj).event?.type; // Get the new value from the event
  const val = JSON.parse(detailsObj).event;
  if(eventType === 'storybook/style-system/change') {
    console.log('sourabh-qq-', val.args[0].selectedStyle);
  }
});