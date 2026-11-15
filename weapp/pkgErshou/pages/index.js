/**
* +----------------------------------------------------------------------
* | 友得云客  - 开启房产营销新纪元
* +----------------------------------------------------------------------
* | Copyright (c) 2019~2023 优得（西安）信息科技有限公司版权所有
* +----------------------------------------------------------------------
* | Licensed 友得云客不是自由软件 未经允许不可移除相关版权
* +----------------------------------------------------------------------
* | Author: www.youdeyunke.com
* +----------------------------------------------------------------------
*/
// pkgErshou/pages/index.js
const houseApi = require("../../api/house")

Page({
    data: {
        items: [],
        business: '',
        kw: '',
        filterOption: {},
        filter: { page: 1 },
        loading: false,
        error: '',
        filterError: '',
        hasMore: true
    },

    onLoad(options) {
        const business = options.business || '出租'
        wx.setNavigationBarTitle({ title: business })
        this.setData({
            business,
            filter: { business, page: 1 }
        })
        this.loadData()
        this.loadPostFilter()
    },

    kwSearch(e) {
        const filter = { ...this.data.filter, page: 1 }
        const kw = String(e.detail || '').trim()
        if (kw) filter.kw = kw
        else delete filter.kw
        this.setData({ kw, filter, items: [], hasMore: true })
        this.loadData()
    },

    filterChange(e) {
        const filter = { ...e.detail, business: this.data.business, page: 1 }
        this.setData({ filter, items: [], hasMore: true })
        this.loadData()
    },

    async loadPostFilter() {
        this.setData({ filterError: '' })
        try {
            const response = await houseApi.getHouseFilter(this.data.business)
            this.setData({ filterOption: response.data.data })
        } catch (error) {
            this.setData({ filterError: '筛选条件加载失败，点击重试' })
        }
    },

    async loadData() {
        const requestId = (this.requestId || 0) + 1
        this.requestId = requestId
        const query = { ...this.data.filter }
        this.setData({ loading: true, error: '' })
        try {
            const response = await houseApi.getHouseList(query)
            if (this.requestId !== requestId) return
            const rows = response.data.data.result
            if (!Array.isArray(rows)) throw new Error('Invalid listing response')
            this.setData({
                items: query.page === 1 ? rows : this.data.items.concat(rows),
                hasMore: rows.length > 0
            })
        } catch (error) {
            if (this.requestId !== requestId) return
            this.setData({ error: '房源加载失败，点击重试' })
        } finally {
            if (this.requestId === requestId) this.setData({ loading: false })
        }
    },

    onPullDownRefresh() {
        this.setData({
            filter: { ...this.data.filter, page: 1 },
            hasMore: true
        })
        return this.loadData().finally(() => wx.stopPullDownRefresh())
    },

    onReachBottom() {
        if (this.data.loading || !this.data.hasMore || this.data.error) return
        this.setData({
            filter: { ...this.data.filter, page: this.data.filter.page + 1 }
        })
        this.loadData()
    },

    onUnload() {
        // Late requests must not update a page that has already closed.
        this.requestId = (this.requestId || 0) + 1
    }
})
