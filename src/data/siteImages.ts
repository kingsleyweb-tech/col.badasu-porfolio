import { resolveImageUrl } from '../utils/imageResolver'

/** Local photographs used as fixed artwork across the public pages (page heroes, mosaics, feature panels). */
export const siteImages = {
  crest: '/crest.svg',
  portrait: resolveImageUrl('hero/a1.png'),
  officersGroup: resolveImageUrl('hero/a4.png'),
  meeting: resolveImageUrl('hero/a5.png'),
  flags: resolveImageUrl('hero/a6.png'),
  ecowasChamber: resolveImageUrl('hero/ecowas.jpeg'),
  ecowasMeeting: resolveImageUrl('ecowas/ecowas-bg.jpeg'),
  boundary: resolveImageUrl('hero/boundary.jpeg'),
  graduation: resolveImageUrl('hero/graduation.jpeg'),
  graduationProfile: resolveImageUrl('hero/profile-home.jpeg'),
  television: resolveImageUrl('hero/tv3.jpeg'),
  leadership: resolveImageUrl('leadership.png'),
  service: resolveImageUrl('service.png'),
  excellence: resolveImageUrl('excellence.png'),
}
