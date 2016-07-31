/* global mf */

(function () {
    if (!window.mf)
        return false;

    mf.attrAnc = 'data-anc';
    mf.ancTreeView = 'mftv';
    mf.ancTreeNode = 'mftvn';
    mf.ancTreeNodeAvatar = 'mftvnav';
    mf.attrExpanded = 'data-expanded';

    /**
     * 
     * @returns {mf.MFTreeView} 
     */
    function tv() {
        if(arguments.length){
            var obj = arguments[0];
            if(typeof obj == 'object'){
                if('clientHeight' in obj){
                    return obj.closest(sprintf('[%s="%s"]', mf.attrAnc, mf.ancTreeView)).node.owner;
                }
                if(obj.hasOwnProperty('owner')){
                    return obj.owner;
                }
            }
        }
    }

    mf.MFTreeView = function (element, options) {
        if (!options || options == undefined)
            options = {};
        this.init = function (options) {
            mf.fire(this.element, 'onCreate', {detail: this});
            return this;
        };
        this.element = element;
        this.element.setAttribute(mf.attrAnc, mf.ancTreeView);
        this.element.setAttribute('unselectable', 'on');
        this.element.onselectstart = function () {
            return false;
        };
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
        mf.on(this.element, 'mousedown, onmousedown', this.onMouseDown);
        mf.on(this.element, 'mouseup, onmouseup', this.onMouseUp);
        mf.on(this.element, 'mousemove, onmousemove', this.onMouseMove);
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
            //preventSelection(this.element);
        },
        _createAvatar: function (e) {
            mf.dragElement.avatar = mf.dragElement.cloneNode(true);
            mf.dragElement.avatar.setAttribute(mf.attrAnc, mf.ancTreeNodeAvatar);
            this.element.appendChild(mf.dragElement.avatar);
            console.log(mf.dragElement);
        },
        _destroyAvatar: function () {
            this.element.removeChild(mf.dragElement.avatar);
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
        },
        /* node listeners */
        onMouseDown: function (e) {
            if (e.which !== 1)
                return;
            var el = e.target.closest(sprintf('[%s="%s"]', mf.attrAnc, mf.ancTreeNode));
            if (!el) {
                return;
            } else {
                mf.dragElement = el;
                mf.dragElement.sX = e.pageX;
                mf.dragElement.sY = e.pageY;
                if (!mf.dragElement.avatar) {
                    mf.dragElement.node.owner._createAvatar(e);
                }
            }
        },
        onMouseUp: function (e) {
            //this.node._destroyAvatar();
            //mf.dragElement = null;
        },
        onMouseMove: function (e) {
            if (!mf.dragElement)
                return;
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
            this.element.setAttribute(mf.attrAnc, mf.ancTreeNode);
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

    mf.MFTreeView.prototype.version = '0.0.1a';
})();

