---
to: .storybook/preview.ts
---
<%_
    const resources = resourceList.split(',')
    for (let resource of resources) {
        _%>import '<%= resource %>';
    <%_}
    _%>import '../src/main/webpack/site/main.js';<%_
_%>
