import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import styled from 'styled-components';
import Button from 'react-bootstrap/Button';
import filter from 'lodash-es/filter';
import DelayedLoad from '../Widgets/DelayedLoad';
import GuideList from './GuideList';
import LoadingWheel from '../LoadingWheel';
import OrganizationActions from '../../actions/OrganizationActions';
import OrganizationStore from '../../stores/OrganizationStore';
import SearchBar from '../Search/SearchBar';
import VoterGuideActions from '../../actions/VoterGuideActions';
import VoterGuideStore from '../../stores/VoterGuideStore';
import { renderLog } from '../../utils/logging';
import VoterStore from '../../stores/VoterStore';

class VoterGuideFollowing extends Component {
  static propTypes = {
    organizationWeVoteId: PropTypes.string.isRequired,
  };

  constructor (props) {
    super(props);
    this.state = {
      editMode: false,
      linkedOrganizationWeVoteId: '',
      organizationName: '',
      searchTerm: '',
      voterGuideFollowedList: [],
      voterGuideFollowedListFilteredBySearch: [],
    };
  }

  componentDidMount () {
    const { organizationWeVoteId } = this.props;
    this.organizationStoreListener = OrganizationStore.addListener(this.onOrganizationStoreChange.bind(this));
    this.voterGuideStoreListener = VoterGuideStore.addListener(this.onVoterGuideStoreChange.bind(this));
    this.voterStoreListener = VoterStore.addListener(this.onVoterStoreChange.bind(this));
    const organization = OrganizationStore.getOrganizationByWeVoteId(organizationWeVoteId);
    let organizationName;
    if (organization && organization.organization_we_vote_id) {
      organizationName = organization.organization_name;
      this.setState({
        organizationName,
      });
    } else {
      OrganizationActions.organizationRetrieve(organizationWeVoteId);
    }
    this.onVoterStoreChange();
    OrganizationActions.organizationsFollowedRetrieve();
    VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(organizationWeVoteId);
    this.setState({
      voterGuideFollowedList: VoterGuideStore.getVoterGuidesFollowedByOrganization(organizationWeVoteId),
    });
  }

  componentWillReceiveProps (nextProps) {
    const { organizationWeVoteId } = this.props;
    const { organizationWeVoteId: nextOrganizationWeVoteId } = nextProps;
    // When a new organization is passed in, update this component to show the new data
    this.onOrganizationStoreChange();
    if (organizationWeVoteId && nextOrganizationWeVoteId && organizationWeVoteId !== nextOrganizationWeVoteId) {
      OrganizationActions.organizationsFollowedRetrieve();
      VoterGuideActions.voterGuidesFollowedByOrganizationRetrieve(nextOrganizationWeVoteId);
      this.setState({
        voterGuideFollowedList: VoterGuideStore.getVoterGuidesFollowedByOrganization(nextOrganizationWeVoteId),
      });
    }
  }

  componentWillUnmount () {
    this.organizationStoreListener.remove();
    this.voterGuideStoreListener.remove();
    this.voterStoreListener.remove();
  }

  onOrganizationStoreChange () {
    const { organizationWeVoteId } = this.props;
    const organization = OrganizationStore.getOrganizationByWeVoteId(organizationWeVoteId);
    let organizationName;
    if (organization && organization.organization_we_vote_id) {
      organizationName = organization.organization_name;
      this.setState({
        organizationName,
      });
    }
    // We also want to update voterGuideFollowedList from the VoterGuideStore when there is a change in the OrganizationStore
    this.onVoterGuideStoreChange();
  }

  onVoterGuideStoreChange () {
    const { organizationWeVoteId } = this.props;
    this.setState({
      voterGuideFollowedList: VoterGuideStore.getVoterGuidesFollowedByOrganization(organizationWeVoteId),
    });
  }

  onVoterStoreChange () {
    const voter = VoterStore.getVoter();
    if (voter) {
      this.setState({
        linkedOrganizationWeVoteId: voter.linked_organization_we_vote_id,
      });
    }
  }

  onKeyDownEditMode (event) {
    const enterAndSpaceKeyCodes = [13, 32];
    const scope = this;
    if (enterAndSpaceKeyCodes.includes(event.keyCode)) {
      const { editMode } = this.state;
      scope.setState({ editMode: !editMode });
    }
  }

  followAllOrganizations = () => {
    VoterGuideActions.voterFollowAllOrganizationsFollowedByOrganization(this.state.organization.organization_we_vote_id);
  }

  searchFollowingVoterGuides = (searchTerm) => {
    if (searchTerm.length === 0) {
      this.setState({
        searchTerm: '',
        voterGuideFollowedListFilteredBySearch: [],
      });
    } else {
      const searchTermLowerCase = searchTerm.toLowerCase();
      const { voterGuideFollowedList } = this.state;
      const searchedFollowedList = filter(voterGuideFollowedList,
        user => user.voter_guide_display_name.toLowerCase().includes(searchTermLowerCase));

      this.setState({
        searchTerm,
        voterGuideFollowedListFilteredBySearch: searchedFollowedList,
      });
    }
  }

  clearSearchBarFunction = () => {
    this.setState({
      searchTerm: '',
      voterGuideFollowedListFilteredBySearch: [],
    });
  }

  toggleEditMode () {
    const { editMode } = this.state;
    this.setState({ editMode: !editMode });
  }

  render () {
    renderLog('VoterGuideFollowing');  // Set LOG_RENDER_EVENTS to log all renders
    // console.log('VoterGuideFollowing render');
    const { organizationWeVoteId } = this.props;
    const {
      linkedOrganizationWeVoteId, organizationName, searchTerm,
      voterGuideFollowedList, voterGuideFollowedListFilteredBySearch,
    } = this.state;
    if (!organizationWeVoteId) {
      return <div>{LoadingWheel}</div>;
    }
    let lookingAtSelf = false;
    if (linkedOrganizationWeVoteId && organizationWeVoteId) {
      lookingAtSelf = linkedOrganizationWeVoteId === organizationWeVoteId;
    }

    return (
      <Wrapper>
        {/* Since VoterGuidePositions, VoterGuideFollowing, and VoterGuideFollowers are in tabs the title seems to use the Helmet values from the last tab */}
        <Helmet title={`${organizationName} - We Vote`} />
        <div className="card">
          <ul className="card-child__list-group">
            {((voterGuideFollowedList && voterGuideFollowedList.length > 0) ||
              (voterGuideFollowedListFilteredBySearch && voterGuideFollowedListFilteredBySearch.length > 0)) ? (
                <span>
                  { lookingAtSelf ? (
                    <a // eslint-disable-line
                      className="fa-pull-right u-push--md"
                      onKeyDown={this.onKeyDownEditMode.bind(this)}
                      onClick={this.toggleEditMode.bind(this)}
                    >
                      {this.state.editMode ? 'Done Editing' : 'Edit'}
                    </a>
                  ) : (
                    <Button
                      variant="success"
                      size="small"
                      bsPrefix="fa-pull-right u-push--md"
                      onClick={this.followAllOrganizations}
                    >
                      <span>Follow All</span>
                    </Button>
                  )}
                  <TitleWrapper>
                    {lookingAtSelf ? (
                      <h4 className="card__additional-heading">
                        You Are Following
                        <span className="d-none d-sm-block">
                          {' '}
                          {voterGuideFollowedList.length}
                          {' '}
                          Organizations or People
                        </span>
                      </h4>
                    ) : (
                      <h4 className="card__additional-heading">
                        {organizationName}
                        {' '}
                        is Following
                      </h4>
                    )}
                  </TitleWrapper>
                </span>
              ) : (
                <DelayedLoad showLoadingText waitBeforeShow={2000}>
                  {lookingAtSelf ?
                    <h4 className="card__additional-heading">You&apos;re not following anyone.</h4> : (
                      <h4 className="card__additional-heading">
                        {organizationName}
                        {' '}
                        is not following anyone.
                      </h4>
                    )}
                </DelayedLoad>
              )
            }
            {/* ********** */}
            {/* Search Box */}
            {voterGuideFollowedList && voterGuideFollowedList.length > 0 && (
              <SearchInputWrapper>
                <SearchBar
                  clearButton
                  clearFunction={this.clearSearchBarFunction}
                  placeholder="Search these voter guides"
                  searchButton
                  searchFunction={this.searchFollowingVoterGuides}
                  searchUpdateDelayTime={200}
                />
              </SearchInputWrapper>
            )}
            {/* ***************** */}
            {/* Results Not Found */}
            {(searchTerm && (voterGuideFollowedListFilteredBySearch && voterGuideFollowedListFilteredBySearch.length === 0)) && (
              <SearchResultsWrapper>
                <h4 className="card__additional-heading">
                  &quot;
                  {searchTerm}
                  &quot; not found
                </h4>
              </SearchResultsWrapper>
            )}
            <span>
              <GuideList
                incomingVoterGuideList={searchTerm ? voterGuideFollowedListFilteredBySearch : voterGuideFollowedList}
                instantRefreshOn
              />
            </span>
          </ul>
        </div>
      </Wrapper>
    );
  }
}

const SearchInputWrapper = styled.div`
  margin-left: 15px;
  margin-right: 15px;
  margin-bottom: 8px;
`;

const SearchResultsWrapper = styled.div`
  margin-left: 15px;
  margin-right: 15px;
`;

const TitleWrapper = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    margin-left: 15px;
    margin-right: 15px;
  }
`;

const Wrapper = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.md}) {
    // margin-left: 15px;
    // margin-right: 15px;
  }
`;

export default (VoterGuideFollowing);
