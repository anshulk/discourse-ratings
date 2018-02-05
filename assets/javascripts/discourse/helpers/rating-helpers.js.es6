import { registerUnbound } from 'discourse-common/lib/helpers';
import { starRatingRaw, starRatingRawMean} from '../lib/rating-utilities';

registerUnbound('star-rating-raw', function(rating, opts) {
  return new Handlebars.SafeString(starRatingRaw(rating, opts));
});

registerUnbound('mean-rating', function(topic) {
  return (topic.average_rating+topic.average_rating2+topic.average_rating1+topic.average_rating3)/4;
});

registerUnbound('average-rating', function(topic) {
  let html = `${topic.average_rating}`;
  return new Handlebars.SafeString(html);
});

registerUnbound('average-rating1', function(topic) {
  let html = `${topic.average_rating1}`;
  return new Handlebars.SafeString(html);
});

registerUnbound('average-rating2', function(topic) {
  let html = `${topic.average_rating2}`;
  return new Handlebars.SafeString(html);
});

registerUnbound('average-rating3', function(topic) {
  let html = `${topic.average_rating3}`;
  if (Discourse.SiteSettings.rating_show_count && topic.rating_count) {
    html += `<br> ( ${topic.rating_count} ${I18n.t('topic.rating_count')} ) `;
  }
  return new Handlebars.SafeString(html);
});
