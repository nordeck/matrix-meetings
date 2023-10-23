# ADR002: Use Redux Tookit Query (RTK Query)

Status: accepted

<!-- These documents have names that are short noun phrases. For example, "ADR001: Deployment on Ruby on Rails 3.0.10" or "ADR009: LDAP for Multitenant Integration" -->

## Context

<!--
This section describes the forces at play, including technological, political, social, and project local. These forces are probably in tension, and should be called out as such. The language in this section is value-neutral. It is simply describing facts. -->

The meetings widget needs to keep track a number of different (>10) matrix events (see [ADR001](./adr001-list-meetings-from-widget-api.md)).
Each event type should be added to a Redux slice with limited complexity.

## Decision

<!-- This section describes our response to these forces. It is stated in full sentences, with active voice. "We will ..." -->

We will use the [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) library to setup the slice, load data, and perform mutations.
It will automatically setup the state structure and provide loading events that can be used in other reducers if needed.

## Consequences

<!-- This section describes the resulting context, after applying the decision. All consequences should be listed here, not just the "positive" ones. A particular decision may have positive, negative, and neutral consequences, but all of them affect the team and project in the future. -->

RTK Query is an opinionated framework that was designed by the Redux maintainers.
It provides a wrapper around CRUD APIs and provides caching, error handling, and loading states out-of-the-box.
Originally, it is designed to support HTTP and GraphQL APIs, but it can also be used with other transport types.

### Store Structure

We will use `createEntityAdapter<StateEvent<_TestEvent_>>()` as a datastructure for each type ([learn more](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#normalizing-data-with-createentityadapter)).
This will give us convenient helpers to store, access, and mutate data.

### Data Fetching

1. We will create a new API that provides a `get<EventType>` handler for each event (see also [no-op query](https://redux-toolkit.js.org/rtk-query/usage/customizing-queries#using-a-no-op-queryfn)):

<!--prettier-ignore-->
   ```ts
   import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';
   import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
   import { TestEvent } from './model';

   export const meetingsApi = createApi({
     reducerPath: 'meetingsApi',
     // don't use a built-in transport
     baseQuery: fakeBaseQuery(),
     endpoints: (builder) => ({
       // create a getter for test events.
       // <void> is the endpoint parameter.
       getTestEvent: builder.query<EntityState<StateEvent<TestEvent>>, void>({
         // use queryFn to execute custom logic
         queryFn() {
           /* TODO */
         },
       }),

       // ...
     }),
   });
   ```

2. We will call the `WidgetApi` in the `queryFn` to receive the initial state ([learn more](https://redux-toolkit.js.org/rtk-query/usage-with-typescript#typing-a-queryfn)):

   ```ts
   // ...

   getTestEvent: builder.query<State<TestEvent>[], void>({
     async queryFn(_, { extra }) {
       // the API is provided by the redux thunk middleware
       const { widgetApi } = extra as ThunkExtraArgument;

       const events = await widgetApi.receiveStateEvents(
         'my.state.event'
       );

       const data = entityAdapter.upsertMany(
         entityAdapter.getInitialState(),
         // let's discard invalid events
         events.filter(validateTestStateEvent)
       );

       return { data };
     },
   }),
   ```

3. We will use `onCacheEntryAdded` to keep the events updated ([learn more](https://redux-toolkit.js.org/rtk-query/usage/streaming-updates)):

   ```ts
   // ...

   getTestEvent: builder.query<State<TestEvent>[], void>({
     async queryFn(_, { extra }) {
       /* ... */
     },

     async onCacheEntryAdded(
       _,
       { cacheDataLoaded, cacheEntryRemoved, extra, updateCachedData }
     ) {
       const { widgetApi } = extra as ThunkExtraArgument;

       // wait until first data is cached
       await cacheDataLoaded;

       const subscription = widgetApi
         .observeStateEvents('my.state.event')
         .pipe(filter(validateTestStateEvent))
         .subscribe((event) => {
           // update the state with the new event.
           updateCachedData((state) => {
             entityAdapter.upsertMany(state, events);
           });
         });

       // wait until subscription is cancelled
       await cacheEntryRemoved;

       subscription.unsubscribe();
     }
   }),
   ```

   > The [`bufferTime` operator](https://rxjs.dev/api/operators/bufferTime) could batch incoming events to e.g. 100ms windows.

4. We will subscribe to the endpoint when the application is started:

   ```ts
   let subscription = dispatch(meetingsApi.endpoints.getTestEvent.initiate());
   await subscription;

   // ... on application shutdown ...

   subscription.unsubscribe();
   ```

### Data Access

RTK Query provides hooks to access data:

```ts
const { data, isLoading } = useGetRoomMembersQuery();
```

It also provides selectors that can be used to compose different events together.
We will provide a `select[All]Meetings(state)` selector that will compose each individual event state and provide a usable state to all the components.

```ts
const allMeetings = useAppSeletor(selectAllMeetings);
```

### Mutations

We will use RTK Query to do [mutations](https://redux-toolkit.js.org/rtk-query/usage/mutations).

They are created similar to queries:

```ts
export const meetingsApi = createApi({
  reducerPath: 'meetingsApi',
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    createTest: builder.mutation<RoomEvent<unknown>, TestOptions>({
      // create a mutation.
      // TestOptions describes the format of opts
      queryFn: async (opts, { extra }) => {
        // the API is provided by the redux thunk middleware
        const { widgetApi } = extra as ThunkExtraArgument;

        const event = await widgetApi.sendRoomEvent('my.room.event', opts);

        return { data: event };
      },
    }),

    // ...
  }),
});
```

They are used with hooks:

```ts
const [createTest, { data: createTestResult }] = useCreateMeetingMutation();

// await also returns the result
const result = await createTest({ my: 'content' }).unwrap();
```

The hook also provides status data for the current component:

```tsx
const [createTest, { isError, isLoading: isCreating }] =
  useUpdateMeetingWidgetsMutation();
```

It is also possible to react to the the `matchFulfilled`, `matchPending`, or `matchRejected` actions of each query or mutation [in other slices](https://redux-toolkit.js.org/rtk-query/usage/examples#using-extrareducers).
But this feature won't be used in the meetings widget.

<!-- This template is taken from a blog post by Michael Nygard http://thinkrelevance.com/blog/2011/11/15/documenting-architecture-decisions -->
