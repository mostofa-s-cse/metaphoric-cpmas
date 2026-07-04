import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const websiteApi = createApi({
  reducerPath: 'websiteApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/website' }),
  tagTypes: ['WebsiteSettings', 'WebsiteSection', 'WebsiteService', 'WebsitePortfolio', 'WebsiteTeam', 'WebsiteTrustBadge', 'WebsiteTestimonial', 'WebsiteFAQ'],
  endpoints: (builder) => ({
    // Settings
    getSettings: builder.query<any, void>({
      query: () => '/settings',
      providesTags: ['WebsiteSettings'],
      transformResponse: (response: any) => response.data,
    }),
    updateSetting: builder.mutation<any, { key: string; value: any }>({
      query: (body) => ({ url: '/settings', method: 'POST', body }),
      invalidatesTags: ['WebsiteSettings'],
    }),

    // Sections
    getSections: builder.query<any, void>({
      query: () => '/sections',
      providesTags: ['WebsiteSection'],
      transformResponse: (response: any) => response.data,
    }),
    updateSection: builder.mutation<any, any>({
      query: (body) => ({ url: '/sections', method: 'POST', body }),
      invalidatesTags: ['WebsiteSection'],
    }),

    // Services
    getServices: builder.query<any, void>({
      query: () => '/services',
      providesTags: ['WebsiteService'],
      transformResponse: (response: any) => response.data,
    }),
    addService: builder.mutation<any, any>({
      query: (body) => ({ url: '/services', method: 'POST', body }),
      invalidatesTags: ['WebsiteService'],
    }),
    updateService: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/services/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['WebsiteService'],
    }),
    deleteService: builder.mutation<any, string>({
      query: (id) => ({ url: `/services/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsiteService'],
    }),

    // Portfolio
    getPortfolios: builder.query<any, void>({
      query: () => '/portfolio',
      providesTags: ['WebsitePortfolio'],
      transformResponse: (response: any) => response.data,
    }),
    addPortfolio: builder.mutation<any, any>({
      query: (body) => ({ url: '/portfolio', method: 'POST', body }),
      invalidatesTags: ['WebsitePortfolio'],
    }),
    updatePortfolio: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/portfolio/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['WebsitePortfolio'],
    }),
    deletePortfolio: builder.mutation<any, string>({
      query: (id) => ({ url: `/portfolio/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsitePortfolio'],
    }),

    // Team
    getTeam: builder.query<any, void>({
      query: () => '/team',
      providesTags: ['WebsiteTeam'],
      transformResponse: (response: any) => response.data,
    }),
    addTeam: builder.mutation<any, any>({
      query: (body) => ({ url: '/team', method: 'POST', body }),
      invalidatesTags: ['WebsiteTeam'],
    }),
    updateTeam: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/team/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['WebsiteTeam'],
    }),
    deleteTeam: builder.mutation<any, string>({
      query: (id) => ({ url: `/team/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsiteTeam'],
    }),

    // Trust Badges
    getTrustBadges: builder.query<any, void>({
      query: () => '/trust',
      providesTags: ['WebsiteTrustBadge'],
      transformResponse: (response: any) => response.data,
    }),
    addTrustBadge: builder.mutation<any, any>({
      query: (body) => ({ url: '/trust', method: 'POST', body }),
      invalidatesTags: ['WebsiteTrustBadge'],
    }),
    updateTrustBadge: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/trust/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['WebsiteTrustBadge'],
    }),
    deleteTrustBadge: builder.mutation<any, string>({
      query: (id) => ({ url: `/trust/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsiteTrustBadge'],
    }),

    // Testimonials
    getTestimonials: builder.query<any, void>({
      query: () => '/testimonials',
      providesTags: ['WebsiteTestimonial'],
      transformResponse: (response: any) => response.data,
    }),
    addTestimonial: builder.mutation<any, any>({
      query: (body) => ({ url: '/testimonials', method: 'POST', body }),
      invalidatesTags: ['WebsiteTestimonial'],
    }),
    updateTestimonial: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/testimonials/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['WebsiteTestimonial'],
    }),
    deleteTestimonial: builder.mutation<any, string>({
      query: (id) => ({ url: `/testimonials/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsiteTestimonial'],
    }),

    // FAQs
    getFaqs: builder.query<any, void>({
      query: () => '/faqs',
      providesTags: ['WebsiteFAQ'],
      transformResponse: (response: any) => response.data,
    }),
    addFaq: builder.mutation<any, any>({
      query: (body) => ({ url: '/faqs', method: 'POST', body }),
      invalidatesTags: ['WebsiteFAQ'],
    }),
    updateFaq: builder.mutation<any, { id: string; data: any }>({
      query: ({ id, data }) => ({ url: `/faqs/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['WebsiteFAQ'],
    }),
    deleteFaq: builder.mutation<any, string>({
      query: (id) => ({ url: `/faqs/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WebsiteFAQ'],
    }),

  }),
});

export const {
  useGetSettingsQuery, useUpdateSettingMutation,
  useGetSectionsQuery, useUpdateSectionMutation,
  useGetServicesQuery, useAddServiceMutation, useUpdateServiceMutation, useDeleteServiceMutation,
  useGetPortfoliosQuery, useAddPortfolioMutation, useUpdatePortfolioMutation, useDeletePortfolioMutation,
  useGetTeamQuery, useAddTeamMutation, useUpdateTeamMutation, useDeleteTeamMutation,
  useGetTrustBadgesQuery, useAddTrustBadgeMutation, useUpdateTrustBadgeMutation, useDeleteTrustBadgeMutation,
  useGetTestimonialsQuery, useAddTestimonialMutation, useUpdateTestimonialMutation, useDeleteTestimonialMutation,
  useGetFaqsQuery, useAddFaqMutation, useUpdateFaqMutation, useDeleteFaqMutation
} = websiteApi;
