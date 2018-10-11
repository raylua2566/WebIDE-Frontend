import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import './git.css';

import api from '../../../api';
import i18n from '../../../utils/i18n';
import SSH from '../../../share/ssh';
import EnvCard from '../envCard';
import NoData from '../../../share/noData';
import ToolTip from '../../../share/toolTip';
import { notify, NOTIFY_TYPE } from 'components/Notification/actions';
import * as maskActions from 'components/Mask/actions';

class Git extends Component {
    state = {
        desc: '',
        url: '',
        envId: 'ide-tty',
        isCreating: false,
        isToolTipOn: false,
    }

    render() {
        const { desc, url, envId, isCreating, isToolTipOn } = this.state;
        const { envs, language } = this.props;
        let textareaPh, inputPh;
        if (language === 'zh_CN') {
            textareaPh = '一句话描述这个工作空间';
            inputPh = '填写 Git 仓库地址';
        } else {
            textareaPh = 'Describe this workspace in one sentence';
            inputPh = 'Fill in the Git repository address';
        }
        return (
            <div>
                {/* <div className="com-board">
                    <div className="board-label">{i18n('global.description')}</div>
                    <div className="board-content desc">
                        <textarea className="com-textarea" spellCheck={false} placeholder={textareaPh} value={desc} onChange={this.handleDescription}></textarea>
                    </div>
                </div> */}
                <div className="com-board">
                    <div className="board-label">{i18n('global.repoUrl')}*</div>
                    <div className="board-content repo">
                        <div><input className="com-input repo-input" type="text" spellCheck={false} placeholder={inputPh} value={url} onChange={this.handleUrl} /></div>
                        <SSH />
                    </div>
                </div>
                <div className="com-board">
                    <div className="board-label">
                        {i18n('global.env')}
                        *
                        <span className="git-env-tooltip" onMouseEnter={this.handleEnvToolTip} onMouseLeave={this.handleEnvToolTip}>
                            <i className="fa fa-question-circle"></i>
                            <ToolTip on={isToolTipOn} message={isToolTipOn ? i18n('global.envTip') : ''} placement="left" />
                        </span>
                    </div>
                    <div className="board-content env">
                        {
                            envs.length ? (
                                envs.map(env => <EnvCard key={env.name} {...env}
                                    language={language}
                                    envId={envId}
                                    handleSeleteEnv={this.handleSeleteEnv} />
                                )
                            ) : <NoData />
                        }
                    </div>
                </div>
                <div className="com-board">
                    <div className="board-label none"></div>
                    <div className="board-content">
                        <button className="com-button primary" disabled={!url || !envId} onClick={this.handleCreate}>
                            {isCreating ? i18n('global.creating') : i18n('global.create')}
                        </button>
                        <button className="com-button default" onClick={this.handleCancel}>{i18n('global.cancel')}</button>
                    </div>
                </div>
            </div>
        );
    }

    handleEnvToolTip = (event) => {
        this.setState(prevState => ({ isToolTipOn: !prevState.isToolTipOn }));
    }

    handleDescription = (event) => {
        this.setState({ desc: event.target.value });
    }

    handleUrl = (event) => {
        this.setState({ url: event.target.value });
    }

    handleSeleteEnv = (envId) => {
        this.setState({ envId: envId });
    }

    handleCancel = () => {
        this.props.history.push({ pathname: '/dashboard/workspace' });
    }

    handleCreate = () => {
        const { desc, url, envId } = this.state;
        const option = {
            cpuLimit: 2,
            memory: 512,
            storage: 2,
            source: 'Import',
            //desc,
            url,
            envId,
        }
        this.setState({ isCreating: true });
        maskActions.showMask({ message: i18n('global.creatingWS'), shouldHideVideo: true });
        api.cloneWorkspace(option).then(res => {
            this.setState({ isCreating: false });
            maskActions.hideMask();
            if (res.code === 0) {
                this.props.history.push({ pathname: '/dashboard/workspace' });
            } else {
                notify({ notifyType: NOTIFY_TYPE.ERROR, message: res.msg || 'Failed to create workspace' });
            }
        }).catch(err => {
            this.setState({ isCreating: false });
            maskActions.hideMask();
            notify({ notifyType: NOTIFY_TYPE.ERROR, message: err });
        });
    }
}

const mapState = (state) => {
    return { language: state.language };
}

export default connect(mapState)(withRouter(Git));
