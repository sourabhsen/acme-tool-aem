---
to: stories/<%= name %>.stories.js
unless_exists: true
---
import { StyleSystem } from 'storybook-aem-style-system';
import { aemMetadata } from '@storybook/aem';
import { acmeFetch, getArtboardUrl } from '@hoodoo/acme';
import <%=name%>Policy from '../storybook-assets<%= policiesPath%>/<%= name %>.json'

export default {
  title: '<%= Name %>',
   tags: ['autodocs'],
  decorators: [

  ],
  parameters: {
    myAddonParameter: {
      policy: <%=name%>Policy
    }
  }
};

/**
 *
 * 1. Duplicate any example below to create a story for the specific use case
 * 2. Update the export function name as well as 'name' property
 * 3. Add the appropriate class to the 'cssClasses' array
 *
 */
