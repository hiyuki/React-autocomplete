// 自动完成组件，依赖妹子UI和Immutable
var AutoCompleteInput = React.createClass({
    ajax: null,
    cache: Immutable.Map(),
    getDefaultProps: function () {
        return {
            delay: 500,
            minChars: 2,
            limit: 10,
            scroll: false,
            cacheLength: 5,
            inputWidth: 200
        };
    },
    getInitialState: function () {
        return {
            value: this.props.defaultValue || this.props.value,
            options: Immutable.List(),
            show: false
        };
    },
    componentDidMount: function () {
        $(document).off('click.autoComplete').on('click.autoComplete', function (e) {
            if (!$.contains(React.findDOMNode(this), e.target)) {
                this.close();
            }
        }.bind(this));
    },
    componentWillUnmount: function () {
        this.unbindOuterHandlers();
    },
    bindOuterHandlers: function () {
        $(document).off('click.autoComplete').on('click.autoComplete', function (e) {
            if (this.isMounted() && !$.contains(React.findDOMNode(this), e.target)) {
                this.close();
            }
        }.bind(this));
    },
    unbindOuterHandlers: function () {
        $(document).off('click.autoComplete');
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.value !== undefined && nextProps.value !== null) {
            this.setState({value: nextProps.value});
        }
    },
    shouldComponentUpdate: function (nextProps, nextState) {
        var np = Immutable.fromJS(nextProps).delete('onChange');
        var tp = Immutable.fromJS(this.props).delete('onChange');
        var ns = Immutable.fromJS(nextState);
        var ts = Immutable.fromJS(this.state);
        return !Immutable.is(np, tp) || !Immutable.is(ns, ts);
    },
    handleChange: function (e) {
        if (this.props.value !== undefined && this.props.value !== null) {
            this.props.onChange(e);
        }
        else {
            this.setValue(e.target.value);
        }
        if (e.target.value.length >= this.props.minChars) {
            if (this.cache.has(e.target.value)) {
                this.setState({options: this.cache.get(e.target.value), show: true});
            }
            else {
                var key = e.target.value;
                var params = {
                    limit: this.props.limit,
                    q: key
                };
                this.ajax && this.ajax.abort();
                this.ajax = $.get(this.props.url, params, function (res) {
                    if (res && this.isMounted()) {
                        this.ajax = null;
                        var options = Immutable.fromJS(res.split('\n').slice(0, this.props.limit).map(function (d) {
                            return d.split('|').slice(0, 2);
                        }.bind(this)));
                        if (this.cache.size >= this.props.cacheLength) {
                            this.cache = this.cache.delete(this.cache.keySeq().get(0));
                        }
                        this.cache = this.cache.set(key, options);
                        this.setState({options: options, show: true});
                    }
                }.bind(this));
            }
            this.bindOuterHandlers();
        }
    },
    handleClick: function (e) {
        if (this.state.show) {
            this.close();
        }
        else {
            this.handleChange(e);
        }
    },
    close: function () {
        this.unbindOuterHandlers();
        this.setState({show: false});
    },
    setValue: function (value) {
        if (typeof this.props.onChange === 'function') {
            this.props.onChange(value);
        }
        this.setState({
            value: value
        });
    },
    handleCheck: function (value) {
        if (this.props.value !== undefined && this.props.value !== null) {
            this.props.onChange(value);
        }
        else {
            this.setValue(value);
        }
        this.close();
    },
    // API for getting component value
    getValue: function () {
        return this.state.value;
    },
    liGenerator: function () {
        if (this.state.options.size && this.state.value) {
            return this.state.options.map(function (d, i) {
                if (typeof d.get(0) === 'string' && d.get(0).indexOf(this.state.value) !== -1) {
                    var user = (
                        <span>
                        {d.get(0).substr(0, d.get(0).indexOf(this.state.value))}
                            <strong>
                                   {d.get(0).substr(d.get(0).indexOf(this.state.value), this.state.value.length)}
                            </strong>
                            {d.get(0).substr(d.get(0).indexOf(this.state.value) + this.state.value.length)}
                        </span>
                        );
                    return (
                        <li key={i}>
                            <a onClick={this.handleCheck.bind(this, d.get(0))} href='javascript: void(0)'>{user}({d.get(1)})</a>
                        </li>
                        );
                }
            }.bind(this));
        }
        return null;

    },

    render: function () {
        var inputStyle = {width: this.props.inputWidth};
        return (
            <div className={this.state.show ? 'am-dropdown am-active' : 'am-dropdown'}>
                <input style={inputStyle} type='text' className='am-form-field am-input-sm' ref='field' onChange={this.handleChange} onClick={this.handleClick} value={this.state.value}/>
                <ul className="am-dropdown-content">
                    {this.liGenerator()}
                </ul>
            </div>
            );
    }

});
