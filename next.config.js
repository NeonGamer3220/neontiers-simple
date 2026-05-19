/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/vanilla', destination: '/?mode=vanilla' },
      { source: '/uhc', destination: '/?mode=uhc' },
      { source: '/pot', destination: '/?mode=pot' },
      { source: '/nethpot', destination: '/?mode=nethpot' },
      { source: '/smp', destination: '/?mode=smp' },
      { source: '/sword', destination: '/?mode=sword' },
      { source: '/axe', destination: '/?mode=axe' },
      { source: '/mace', destination: '/?mode=mace' },
      { source: '/cart', destination: '/?mode=cart' },
      { source: '/creeper', destination: '/?mode=creeper' },
      { source: '/diasmp', destination: '/?mode=diasmp' },
      { source: '/ogvanilla', destination: '/?mode=ogvanilla' },
      { source: '/shieldlessuhc', destination: '/?mode=shieldlessuhc' },
      { source: '/spearmace', destination: '/?mode=spearmace' },
      { source: '/spearelytra', destination: '/?mode=spearelytra' },
      { source: '/stickfight', destination: '/?mode=stickfight' },
      { source: '/trident', destination: '/?mode=trident' },
      ];
  },
};

module.exports = nextConfig;
