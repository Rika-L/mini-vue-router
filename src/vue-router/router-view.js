import { computed, h, inject, provide } from 'vue'

export const RouterView = {
  name: 'RouterView',
  setup(_props, { slots }) {
    const depth = inject('depth', 0)
    const injectRoute = inject('route location')

    const matchedRouteRef = computed(() => injectRoute.matched[depth])
    provide('depth', depth + 1)

    return () => {
      const matchedRoute = matchedRouteRef.value // record
      console.log('matchedRoute', matchedRoute)

      const viewComponent = matchedRoute && matchedRoute.components.default
      if (!viewComponent) {
        return slots.default && slots.default()
      }

      return h(viewComponent)
    }
  },
}
