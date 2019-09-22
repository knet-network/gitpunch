import React, { Component } from 'react'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogContent'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import withMobileDialog from '@material-ui/core/withMobileDialog'
import withStyles from '@material-ui/core/styles/withStyles'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Switch from '@material-ui/core/Switch'
import CircularProgress from '@material-ui/core/CircularProgress'
import { StarIcon } from '../components/icons'
import { loadStarsFirstPage, loadStarsLink } from '../services/github'
const { assign } = Object

const emptyState = {
  links: {},
  repos: [],
  accessToken: '',
  stars: [],
  loading: false,
  loadedOnce: false
}

class Stars extends Component {
  constructor (props) {
    super(props)
    this.state = {...emptyState}
    this.componentWillReceiveProps(props)
  }

  render () {
    const { classes, starsOpen, starsWorking, setStarsOpen, fullScreen, width, toggleWatchingStars, watchingStars, toggleUnwatchingNonstars, unwatchingNonstars } = this.props
    const { stars, links, loading, loadedOnce } = this.state
    const showWatchAll = !!stars.length || watchingStars
    const showContent = !watchingStars || starsWorking
    const showNav = (!!stars.length && !watchingStars) || starsWorking
    const noStars = !stars.length && !loading && loadedOnce
    return (
      <Dialog
        aria-labelledby="stars-dialog-title"
        onClose={() => setStarsOpen({ open: false })}
        open={starsOpen}
        fullScreen={fullScreen}
        width={width}
      >
        <DialogTitle id="stars-dialog-title">
          <div className={classes.title}>
            <span>Watch {StarIcon()} Stars</span>
            <span style={{ flex: 1 }}></span>
            <IconButton color="inherit" onClick={() => setStarsOpen({ open: false })} aria-label="Close">
              <CloseIcon />
            </IconButton>
          </div>
        </DialogTitle>
        {showWatchAll &&
          <DialogActions classes={{ root: classes.actions }}>
            <div className={classes.watchAllContainer}>
              <FormControlLabel
                classes={{ root: classes.label, label: classes.watchAllText }}
                control={
                  <Switch
                    checked={watchingStars}
                    disabled={starsWorking}
                    onChange={toggleWatchingStars}
                  />
                }
                label="Add All"
              />
              <FormControlLabel
                classes={{ root: classes.label }}
                control={
                  <Switch
                    checked={unwatchingNonstars}
                    onChange={toggleUnwatchingNonstars}
                  />
                }
                label="Remove Nonstars"
              />
              <small>syncs every 15 min</small>
              {starsWorking && <CircularProgress size={24} color="secondary" className={classes.watchingStarsProgress} />}
            </div>
          </DialogActions>
        }
        {showContent && <DialogContent id="stars-dialog-content">
          {stars.map(repo => (
            <div key={repo.id}>
              <div>
                <FormControlLabel
                  classes={{
                    root: classes.label,
                    label: classes.repo
                  }}
                  control={
                    <Switch
                      disabled={starsWorking || watchingStars}
                      checked={repo.gitpunching}
                      onChange={() => this.toggleGitpunching(repo)}
                    />
                  }
                  label={repo.full_name}
                />
              </div>
              <div className={classes.description} style={ { color: '#777' } }>{repo.description || 'No description'}</div>
            </div>
          ))}
          {noStars && 'Looks like you haven\'t stars anything on GitHub yet'}
          {loading && !loadedOnce && <CircularProgress size={24} color="secondary"/>}
        </DialogContent>}
        {showNav &&
          <DialogActions classes={{ root: classes.actions }}>
            <div className={classes.nav}>
              {['first', 'prev', 'next', 'last'].map(rel => (
                <Button key={rel} disabled={!links[rel]}
                  onClick={() => links[rel] && this.load(links[rel])}
                >
                  {rel}
                </Button>
              ))}
            </div>
          </DialogActions>
        }
      </Dialog>
    )
  }

  async componentWillReceiveProps (nextProps) {
    const { accessToken, starsOpen, repos } = nextProps
    if (accessToken === this.state.accessToken) {
      if (repos !== this.props.repos) {
        this.persist({
          stars: this.appendStuff(this.state.stars, repos)
        })
      }
      return
    }
    if (!starsOpen) { return }
    try {
      if (!accessToken) { throw new Error() }
      this.persist({ loading: true })
      const { links, items = [] } = await loadStarsFirstPage(accessToken)
      this.persist({
        links,
        loading: false,
        accessToken,
        stars: this.appendStuff(items, repos),
        loadedOnce: true
      })
    } catch (e) {
      this.persist({ ...emptyState, loadedOnce: true })
    }
  }

  persist (part) {
    this.setState(state => assign(state, part))
  }

  toggleGitpunching (repo) {
    const { full_name, gitpunching } = repo
    gitpunching ? this.props.deleteRepo({ repo: full_name }) : this.props.createRepo({ repo: full_name, muted: false, filter: 3 })
  }

  appendStuff (stars, repos) {
    if (!stars.length) { return stars }
    return stars.map(repo => {
      const gitpunchRepo = repos.find(r => r.repo === repo.full_name)
      repo.gitpunching = Boolean(gitpunchRepo)
      repo.muted = gitpunchRepo && gitpunchRepo.muted
      return repo
    })
  }

  async load (link) {
    try {
      const { items, links } = await loadStarsLink({ link, accessToken: this.state.accessToken })
      this.persist({
        stars: this.appendStuff(items, this.props.repos),
        links
      })
      document.getElementById('stars-dialog-content').scrollTop = 0
    } catch (e) {}
  }
}

function styles(theme) {
  return {
    repo: {
      fontSize: '1rem'
    },
    description: {
      fontSize: '0.85rem',
      paddingLeft: '62px'
    },
    title: {
      alignItems: 'center',
      display: 'flex'
    },
    actions: {
      minHeight: theme.spacing(6)
    },
    nav: {
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      paddingBottom: theme.spacing(2)
    },
    watchAllContainer: {
      alignItems: 'center',
      display: 'inline-flex',
      paddingRight: '32px',
      position: 'relative',
      '@global': {
        small: {
          color: theme.palette.primary[500]
        }
      }
    },
    label: {
      marginLeft: 0
    },
    watchAllText: {
      fontSize: '1rem',
      fontWeight: 'bold'
    },
    watchingStarsProgress: {
      position: 'absolute',
      right: 0,
      top: '12px'
    }
  }
}

export default withMobileDialog({ breakpoint: 'xs' })(withStyles(styles)(Stars))
