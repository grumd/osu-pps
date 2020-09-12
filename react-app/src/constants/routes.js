export const routes = {
  maps: {
    path: ({ mode }) => `/${mode}/maps`,
  },
  mappers: {
    path: ({ mode, mapperType = 'pp' }) => `/${mode}/mappers/${mapperType}`,
  },
  farmers: {
    path: ({ mode }) => `/${mode}/farmers`,
  },
  rankings: {
    path: ({ mode }) => `/${mode}/rankings`,
  },
  faq: {
    path: () => `/faq`,
  },
};
