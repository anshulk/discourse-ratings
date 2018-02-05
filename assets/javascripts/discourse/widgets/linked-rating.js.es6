import { createWidget } from 'discourse/widgets/widget';
import DiscourseURL from 'discourse/lib/url';

export default createWidget('linked-rating', {
  tagName: 'span.linked-rating',

  html(attrs) {
    return this.attach('star-rating', {rating: attrs.rating, disabled: attrs.disabled});
    return this.attach('star-rating', {rating: attrs.rating1, disabled: attrs.disabled});
    return this.attach('star-rating', {rating: attrs.rating2, disabled: attrs.disabled});
    return this.attach('star-rating', {rating: attrs.rating3, disabled: attrs.disabled});
  },

  click() {
    DiscourseURL.routeTo(this.attrs.href);
  }
});
