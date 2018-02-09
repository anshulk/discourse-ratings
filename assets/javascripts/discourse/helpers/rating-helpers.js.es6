import { registerUnbound } from 'discourse-common/lib/helpers';
import { starRatingRaw } from '../lib/rating-utilities';

registerUnbound('star-rating-raw', function(rating, opts) {
  return new Handlebars.SafeString(starRatingRaw(rating, opts));
});

registerUnbound('mean-rating', function(topic) {
  return (topic.average_rating+topic.average_rating2+topic.average_rating1+topic.average_rating3)/4;
});


registerUnbound('ratings-string', function(val) {
  return val == 1 ? 'rating' else 'ratings';
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
  return new Handlebars.SafeString(html);
});
