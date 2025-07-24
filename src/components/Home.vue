<script>
export default {
  name: 'Home',
  mounted() {
    console.log(this.$router)
  },
}
</script>

<template>
  home
  <RouterView />
</template>
