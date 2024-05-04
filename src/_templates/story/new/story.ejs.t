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
import <%= path %> from '../<%= templatePath %>';

export const <%= storyName.split(' ').join('') %> = () => `${<%= path %>}`

<%= storyName.split(' ').join('') %>.story = {
  name: '<%= storyName %>',
  parameters: {
    design: {
      
    }
  }
};

// End of story
