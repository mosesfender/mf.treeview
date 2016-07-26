/* global mf */

(function () {
    mf.MFTreeView = function (element, options) {
        this.init = function (options) {
            mf.fire(this.element, 'onCreate', {detail: this});
            return this;
        };
        this.element = element;
        this.element.setAttribute('data-anc', 'mftv');
        mf.extendEx(this, options, ['templates']);
        if (options.templates) {
            for (var p in options.templates) {
                this.templates[p] = options.templates[p];
            }
        }
        ;
        mf.on(this.element, 'onCreate', this.onCreate);
        mf.on(this.element, 'onDrawNode', this.onDrawNode);
        mf.on(this.element, 'onDrawRoot', this.onDrawRoot);
        mf.on(this.element, 'onLoadTreeData', this.onLoadTreeData);
        this.init(options);
        this.element.node = this;
        //return this;
    };
    mf.MFTreeView.prototype = {
        element: {},
        treeNodes: {},
        loadData: function (url) {
            var _this = this;
            var req = mf.xRequest('GET', url, {}, {
                onreadystatechange: function () {
                    if (this.readyState != 4)
                        return;
                    try {
                        mf.fire(_this.element, 'onLoadTreeData', {detail: JSON.parse(this.responseText)});
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
            req.send();
        },
        fillTree: function (parent, data) {
            for (var i = 0; i < data.length; i++) {
                var nd = new mf.MFTreeNodeData();
                mf.extend(nd, data[i]);
                var node = new mf.MFTreeNode(parent, nd);
                if (nd.children.length > 0) {
                    var root = new mf.MFTreeNodes(node);
                    this.fillTree(root, node.data.children);
                }
            }
        },
        /* listeners */
        onCreate: function (e) {
            //console.log(this, e);
        },
        onDrawNode: function (e) {
            //console.log(this, e);
        },
        onDrawRoot: function (e) {
            //console.log(this, e);
        },
        /**
         * @var this {HTMLElement->mf.MFTreeNode.node.element}
         * @param {onLoadTreeData} e
         * @returns {undefined}
         */
        onLoadTreeData: function (e) {
            var root = new mf.MFTreeNodes(this.node);
            this.node.fillTree(root, e.detail.children);
        }
    };
    mf.MFTreeView.prototype.templates = {
        defNodesClass: 'mf-nodes',
        defNodeClass: 'mf-node',
        nodes: function (parent) {
            return mf.createElementEx('ul', parent, {class: this.defNodesClass});
        },
        node: function (parent, data) {
            var ret = mf.createElementEx('li', parent, {class: this.defNodeClass});
            mf.createElementEx('span', ret, {}, data.caption);
            return ret;
        }
    };
    /**
     * 
     * @param {mf.MFTreeView} owner
     * @param {mf.MFTreeNode} parent
     * @param {Object} data
     * @returns {mf.MFTreeNode}
     */
    mf.MFTreeNode = function (parent, data) {
        this.owner = parent.owner;
        this.parent = parent;
        this.data = data;
        this.create();
        return this;
    };
    mf.MFTreeNode.prototype = {
        element: null,
        owner: null,
        parent: null,
        data: null,
        create: function () {
            this.render();
            return this;
        },
        render: function () {
            this.element = this.owner.templates.node(this.parent.element, this.data);
            this.element.node = this;
            mf.fire(this.owner.element, 'onDrawNode', {detail: this});
        }
    };
    mf.MFTreeNodes = function (parent) {
        this.owner = parent.hasOwnProperty('owner') ? parent.owner : parent;
        this.parent = parent;
        this.element = null;
        this.create = function () {
            this.render();
            return this;
        }
        this.render = function () {
            this.element = this.owner.templates.nodes(this.parent.element);
            this.element.node = this;
            mf.fire(this.owner.element, 'onDrawRoot', {detail: this});
        }
        this.create();
        return this;
    }

    mf.MFTreeNodeData = function () {
        return this;
    };
    mf.MFTreeNodeData.prototype = {
        caption: '',
        id: null,
        nodeType: 'ntX',
        expanded: false,
        children: []
    };
})();

