# Database structure

**Rockpool** uses mongodb to store information about users, blogs, articles, and tags using a collection for each. The structure is listed below.

## rp_users

A **user** is a person who interacts with the application in a way that requires them to log in. This includes administrators, blog owners, and Pocket subscribers. Anyone who logs in and subsequently 'updates' their user information will be stored as a user.

| field | description   |
| ---:  |   :---        |
| _id   | `ObjectID` - assigned automatically by Mongo   |
| email | `String` - a valid email address |
| permission | `String` - One of _user_ or _admin_ |

## rp_blogs

A **blog** is any web resource with a valid RSS or Atom feed. The generally expected format is a classic frequently-updated website listing entries in reverse-chronological publication order, but it could be a YouTube channel, podcast channel, microblogging account, or anything else with a parseable feed.

| field | description   |
| ---:  |   :---        |
| _id   | `ObjectID` - assigned automatically by Mongo   |
| url   | `String` - a valid URL pointing to the 'homepage' of the resource - expected to point to an HTML file |
| feed  | `String` - a valid URL pointing to an RSS or Atom feed in the form of an XML file |
| category | `String` - which category has been assigned to the blog by the owner, using a list provided by the administrator of the particular Rockpool instance |
| twHandle (_deprecated_) | `String` - a Twitter handle including the '@' symbol. This field only appears in legacy data that has been migrated from _CommunityTweets_, and is used in cases where there is no registered owner for a blog. |
| approved | `Boolean` - indicates whether the blog has been approved by an administrator |
| announced | `Boolean` - indicates whether the blog has been 'announced' on Twitter and/or Mastodon |
| failing | `Boolean` - indicates whether errors occurred on the last attempt to read the blog's feed |

## rp_articles

An **article** is a standalone _item_ from an RSS/Atom feed, with its own URL. Generally this will be a blog post, but could be a video, image, or audio file.

| field | description   |
| ---:  |   :---        |
| _id   | `ObjectID` - assigned automatically by Mongo   |
| link  | `String` - a valid URL pointing to the article. This is taken from the RSS/Atom feed |
| author  | `String` -  Author of the article. This is taken from the RSS/Atom feed |
| blogLink  | `String` - URL of the publication this article is a part of. This is taken from the RSS/Atom feed |
| date  | `Datetime` - Publication date stored as a UTC datetime. This is taken from the RSS/Atom feed |
| title  | `String` - Title of the article. This is taken from the RSS/Atom feed |
| tweeted  | `Object` - An object containing values for `date` (the last time a tweet was posted about this article, stored as a UTC `Datetime`), and `times` (an `Integer` listing how many times the article has been tweeted) |
| tooted | `Object` - An object containing values for `date` (the last time a toot was posted about this article, stored as a UTC `Datetime`), and `times` (an `Integer` listing how many times the article has been tooted) |
| tags  | `Array` - Metadata tags associated with this article, as an array of strings. This is taken from the _category_ element of the RSS/Atom feed |
| blogTitle  | `String` - The title of the publication this article is a part of. This is taken from the RSS/Atom feed |
| blog_id  | `ObjectID` - The `_id` of the parent **blog**. This is recorded so that articles can still be linked back to the parent blog regardless of whether URLs change |

## rp_tags

A **tag** is a metadata string indicating a topic associated with one or more articles. Tags are listed as an item _category_ in a RSS/Atom feed. Tags are kept in a separate collection to make tag browsing and finding the 'top tags' more efficient.

| field | description   |
| ---:  |   :---        |
| _id   | `ObjectID` - assigned automatically by Mongo   |
| tag  | `String` - The tag text, e.g. "museums" |
| total  | `Integer` - The total number of articles using this tag |

---
[Home](/)  
[Database structure](database.md)  
[Installation](installation.md)  
[Search](search.md)  