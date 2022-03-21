## User Summaries

User summaries are used as the entry point to looking at user's data.

Summaries feature categories with notifications broken up for new data added to their respective categories. 


### Code Logic

1. Supply a user id to the component:
2. Check your notifications for parentUserIds for the associated user (incl yourself)
3. Pull that data without resolving the notifications
4. Set the notification counts in each category by how they occur in the DataTablet, which is sorting those categories.

Categories are arbitrary sorts of structs into the DataTablet from [`brainsatplay-data`](https://github.com/brainsatplay/brainsatplay-data)

They can be created to compile collections by reference into tables sorted by category and timestamp. This is then used to label the summaries and associate the notifications, which can overlap in multiple categories depending on filter settings. This is generalized for sorting arbitrary data types.


Clicking a summary category brings up an abbreviated timeline list and any related time series charts we desire to bring in. This just looks at the latest data plus whatever time series we want to bring in. Time series e.g. sleep patterns or heart rate measurements are compiled into their own data structures from disparate events and data streams that provide that data, so it's collected into a more easily accessible format. 

Clicking again brings up a full breakdown of that category including a more extensive timeline and charting history. Clicking any points in the timeline will give you the full details of those data points/events along with related time series. 