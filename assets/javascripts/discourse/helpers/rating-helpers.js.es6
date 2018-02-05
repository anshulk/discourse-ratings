import { registerUnbound } from 'discourse-common/lib/helpers';
import { starRatingRaw } from '../lib/rating-utilities';

registerUnbound('star-rating-raw', function(rating, opts) {
  return new Handlebars.SafeString(starRatingRaw(rating, opts));
});

registerUnbound('average-rating', function(topic) {
  let html = `${topic.average_rating}`;
  if (Discourse.SiteSettings.rating_show_count && topic.rating_count) {
    html += ` – ${topic.rating_count} ${I18n.t('topic.rating_count')}`;
  }
  return new Handlebars.SafeString(html);
});

registerUnbound('average-rating1', function(topic) {
  let html = `${topic.average_rating1}`;
  if (Discourse.SiteSettings.rating_show_count && topic.rating_count) {
    html += ` – ${topic.rating_count} ${I18n.t('topic.rating_count')}`;
  }
  return new Handlebars.SafeString(html);
});

registerUnbound('average-rating2', function(topic) {
  let html = `${topic.average_rating2}`;
  if (Discourse.SiteSettings.rating_show_count && topic.rating_count) {
    html += ` – ${topic.rating_count} ${I18n.t('topic.rating_count')}`;
  }
  return new Handlebars.SafeString(html);
});
