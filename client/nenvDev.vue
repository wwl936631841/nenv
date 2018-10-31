<template>
    <div class = "dev-wrapper">
        <a @click="handleShow">展开</a>
        <div class = "dev-inner" v-show="isShow">
            <el-tabs v-model="activeName">
                <el-tab-pane label ="页面" name="route" class="dev-tab-pane">
                    <div v-for="r in cFlatRoutes" :key="r.path">
                        <router-link  :to="r.paramsV ? ( [r.path, ...Object.keys(r.paramsV)].reduce((path, x) => path.replace('/:' + x, '/' + r.paramsV[x])) ) : r.path"  class="r-link">
                            <span class="r-name"> {{ r.name }}</span>({{ r.path }})
                        </router-link>
                        <el-input class='r-pramas' v-if="r.params" v-for="p in r.params" :key="p" v-model='r.paramsV[p]'></el-input>
                    </div>
                </el-tab-pane >
                <el-tab-pane class="dev-tab-pane" label = "其他" name="test">不知道还可以提供什么功能</el-tab-pane>
            </el-tabs>
        </div>
    </div> 
</template>
<script>
export default {
    name: 'devPane',
    data () {
        return {
            activeName: 'route',
            cFlatRoutes: [],
            isShow: false
        }
    },
    created () {
        console.log('boot')
        const self = this
        setTimeout(() => {
            self.flush()
        }, 3000)
    },
    // computed: ,
    methods: {
        handleShow () {
            this.isShow = !this.isShow
        },
        flush () {
             const { flatRoutes } = this
            this.cFlatRoutes = nenv.flatRoutes.map(item => {
                const { path } = item
                const params = /\/:[^/]*/.exec(path)
                const res = {
                    path: item.path,
                    name: (item.component || {}).name
                }

                if (params) {
                    res.paramsV = {}
                    res.params = params.map(item => { 
                        const p = item.replace('/:', '')
                        res.paramsV[p] = ''
                        return p
                    })
                }

                return res
            })
            .filter(item => item.path !== '*' && item.name)
            .sort((a, b) => { return a.name[0] > b.name[0]})
        }
    }
}
</script>
<style lang="scss" scoped>
    .dev-wrapper {
            position: fixed;
            top: 100px;
            padding: 10px 20px;
            right: 300px; 
            z-index: 1000;
            background: #fff;
            border: 1px solid black;
    }

    .dev-inner {
        width: 600px;
    }

    .dev-tab-pane {
        
            max-height: 300px;

            overflow: auto;
    }

    .r-link {
        margin: 3px;
        display: inline-block;
        &.active {
            color: #3b8cff
        }
    }

    .r {
        &-name {
            color: red
        }
        &-pramas {
            width: 120px;
        }
    }

</style>


