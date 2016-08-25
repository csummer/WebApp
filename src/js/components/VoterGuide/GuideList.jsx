import React, { Component, PropTypes } from "react";
import ReactCSSTransitionGroup from "react-addons-css-transition-group";
import Organization from "./Organization";
import GuideActions from "../../actions/GuideActions";
import FollowToggle from "../Widgets/FollowToggle";

export default class GuideList extends Component {

  static propTypes = {
    organizations: PropTypes.array
  };

  constructor (props) {
    super(props);
    this.state = { organizations: this.props.organizations };
  }

  componentWillReceiveProps (nextProps){
    this.setState({organizations: nextProps.organizations });
  }

  handleIgnore (id) {
    console.log("GuideList, handleIgnore");
    GuideActions.ignore(id);
    this.setState({ organizations: this.state.organizations.filter( (org) => { return org.organization_we_vote_id !== id;})});
  }

  render () {
    //console.log("components/VoterGuide/GuideList");
    const orgs = this.state.organizations.map( (org) => {
      return <Organization key={org.organization_we_vote_id} {...org}>
            <FollowToggle we_vote_id={org.organization_we_vote_id} />
              <button className="btn btn-default btn-sm"
                      onClick={this.handleIgnore.bind(this, org.organization_we_vote_id)}>
                Ignore
              </button>
          </Organization>;
    });

    return <div className="guidelist">
        <ReactCSSTransitionGroup transitionName="org-ignore" transitionEnterTimeout={400} transitionLeaveTimeout={200}>
          {orgs}
        </ReactCSSTransitionGroup>
      </div>;
  }

}
