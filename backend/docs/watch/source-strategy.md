# MERITLIVES Watch source strategy

Reviewed 2026-10-08. The initial registry is deliberately small. It prioritizes an established, relevant editorial fit and a verifiable stable YouTube channel ID over filling category slots with unverified sources.

| Channel | Category | Priority | Channel ID | Selection basis |
| --- | --- | ---: | --- | --- |
| Fireship | technology | 1 | `UCsBjURrPoezykLs9EqgamOA` | Its public channel description identifies weekly programming tutorials and tech news; the channel is active and focused on software/developer technology. Channel: https://www.youtube.com/@Fireship. Channel ID cross-checked at https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA. |
| Y Combinator | business | 1 | `UCcefcZRL2oaA_uBNeo5UOWg` | YC's own press page says it supports founders launching and scaling technology companies. Public channel activity was checked during source review. Channel: https://www.youtube.com/@ycombinator. ID corroboration: https://vidiq.com/youtube-stats/channel/UCcefcZRL2oaA_uBNeo5UOWg/. |
| Google for Developers | technology | 2 | `UC_x5XG1OV2P6uZZ5FSM9Ttw` | Official developer tutorials/news across AI, cloud, mobile, and web; recent uploads were checked. Channel: https://www.youtube.com/@GoogleDevelopers. ID corroborated by Google's own Data API examples: https://developers.google.com/youtube/v3/sample_requests. |

## Coverage and expansion

No Africa/Nigeria source is activated yet. TechCabal is a strong candidate based on its official social profile, which links its YouTube channel and describes its focus as the people and business of technology in Africa: https://linktr.ee/techcaba. However, this review could not corroborate its underlying `UC`-prefixed channel ID from an authoritative or independently reliable channel-specific record. It is intentionally not inserted until the ID and current upload cadence can be confirmed. The same hold applies to podcast candidates: prefer adding a source with a clear, consistent fit and a verified ID over using a generic channel.

Keep sources active only while their uploads remain within the categories above and their publishing activity is useful. Reassess the source list periodically; this collector only imports from records explicitly marked active.

## API approach

The collector uses `channels.list` to get `contentDetails.relatedPlaylists.uploads`, then reads that playlist with `playlistItems.list` and enriches returned IDs with `videos.list`. This avoids broad search discovery and lets the collector validate duration, visibility, and embeddability. See the official [Channels resource](https://developers.google.com/youtube/v3/docs/channels), [playlist implementation guide](https://developers.google.com/youtube/v3/guides/implementation/videos), and [Videos resource](https://developers.google.com/youtube/v3/docs/videos).

YouTube does not supply orientation as a video field in this API response. The collector therefore treats a short video as an obvious Short only when its title or description explicitly includes `#shorts` / `YouTube Shorts`; it does not infer Shorts from duration or aspect ratio alone.
