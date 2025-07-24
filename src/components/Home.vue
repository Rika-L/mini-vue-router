<script>
export default {
  name: 'Home',
  beforeRouteEnter(to, from, next) {
    console.log('beforeRouteEnter', to, from)
  },
  beforeRouteUpdate(to, from, next) {
    console.log('beforeRouteUpdate', to, from)
  },
  beforeRouteLeave(to, from, next) {
    console.log('beforeRouteLeave', to, from)
  },
  mounted() {
    console.log(this.$router)
  },
}
</script>

<template>
  home
  <RouterView />
</template>
