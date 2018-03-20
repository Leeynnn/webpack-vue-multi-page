<template>
  <div>
      <img src="@/assets/images/mugua.jpg">
      <mHead></mHead>
      <p>I am index!</p>
  </div>
</template>
<script>
import mHead from '@/components/mHead/mHead'
export default {
    components: {
        mHead
    }
}
</script>
<style lang="scss">
body{
    text-align: center;
}
img{
    width: 100px;
    height: 100px;
}
p{
    color: green;
}
</style>
