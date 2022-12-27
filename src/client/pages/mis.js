import { useState, useEffect } from 'react'
import { eliteDateTime, ADD_YEARS_IN_FUTURE } from 'lib/format'
import animateTableEffect from 'lib/animate-table-effect'
import Layout from 'components/layout'
import Panel from 'components/panel'
import MisListPanel from 'components/panels/mis/mis-list-panel'
import MisInspectorPanel from 'components/panels/mis/mis-inspector-panel'
import { useSocket, eventListener, sendEvent } from 'lib/socket'

export default function MisPage () {
  const { connected, active, ready } = useSocket()
  const [componentReady, setComponentReady] = useState(false)
  const [missionEntries, setMissionEntries] = useState([])
  const [selectedMissionEntry, setSelectedMissionEntry] = useState()

  function removeMission(mission) {
    const newMissionEntries = []
    for(let entry of missionEntries) {
      if(entry.MissionID != mission.MissionID)
        newMissionEntries.push(entry)
    }

    updateEntries(newMissionEntries)
  }

  function completeMission(mission) {
    for(let entry of missionEntries) {
      if(entry.MissionID == mission.MissionID) {
        entry.State = "Complete"
        entry.CompleteData = mission
      }
    }

    updateEntries(missionEntries)
  }

  function failMission(mission) {
    for(let entry of missionEntries) {
      if(entry.MissionID == mission.MissionID) {
        entry.State = "Failed"
        entry.FailData = mission
      }
    }

    updateEntries(missionEntries)
  }

  function redirectMission(mission) {
    for(let entry of missionEntries) {
      if(entry.MissionID == mission.MissionID) {
        entry.RedirectData = mission
      }
    }

    updateEntries(missionEntries)
  }

  function addMission(mission) {
    if(mission.Expiry) {
      const currentDate = new Date()
      currentDate.setFullYear(currentDate.getFullYear() + ADD_YEARS_IN_FUTURE)
      const currentTS = currentDate.getTime()
      const expiryDateTs = eliteDateTime(mission.Expiry).jsDate.getTime()
      const expireInSeconds = (((expiryDateTs - currentTS) % 60000) / 1000).toFixed(0)
      mission.Expires = expireInSeconds
    }

    missionEntries.push(mission)
    missionEntries.sort((first, second) => first.Expires - second.Expires)

    updateEntries(missionEntries)
  }

  function updateEntries(missions) {
    setMissionEntries(missions)
    // Only select a log entry if one isn't set already
    setSelectedMissionEntry(prevState => prevState || missions[0])
  }

  useEffect(animateTableEffect)

  useEffect(async () => {
    if (!connected) return
    setComponentReady(false)
    const newMissionEntries = await sendEvent('getMissions', { count: 100 })
    if(!newMissionEntries) return

    const missions = []
    for(let mission of newMissionEntries.Active) {
      mission.State = "Active"
      missions.push(mission)
    }

    for(let mission of newMissionEntries.Failed) {
      mission.State = "Failed"
      missions.push(mission)
    }

    for(let mission of newMissionEntries.Complete) {
      mission.State = "Complete"
      missions.push(mission)
    }

    missions.sort((first, second) => first.Expires - second.Expires)

    console.log(missions)

    if (Array.isArray(missions) && missions.length > 0) {
      updateEntries(missions)
    }
    setComponentReady(true)
  }, [connected, ready])

  useEffect(() => eventListener('newLogEntry', async (newLogEntry) => {
    if (!['MissionAbandoned', 'MissionAccepted', 'MissionCompleted', 'MissionFailed', 'MissionRedirected'].includes(newLogEntry.event))
      return

    switch(newLogEntry.event) {
      case "MissionAbandoned":
        removeMission(newLogEntry)
        break
      case "MissionAccepted":
        addMission(newLogEntry)
        break
      case "MissionCompleted":
        completeMission(newLogEntry)
        break
      case "MissionFailed":
        failMission(newLogEntry)
        break
      case "MissionRedirected":
        redirectMission(newLogEntry)
        break
      default:
        break
    }

    //TODO
    /*setMissionEntries(prevState => [newLogEntry, ...prevState])
    // If no log row is currently selected (focus is not on a table row) then
    // display the most recent log - otherwise leaves it displaying whatever is
    // currently selected.
    if (document.activeElement.tagName !== 'TR') {
      setSelectedLogEntry(newLogEntry)
    }*/
  }), [])

  return (
    <Layout connected={connected} active={active} ready={ready && componentReady}>
      <Panel layout='left-half' scrollable>
        <MisListPanel missionEntries={missionEntries} setSelectedMissionEntry={selectedMissionEntry} />
        {ready && missionEntries.length === 0 && <p style={{ margin: '2rem 0' }} className='text-center text-muted'>No recent log entries</p>}
      </Panel>
      <Panel layout='right-half' scrollable>
        <MisInspectorPanel misEntry={selectedMissionEntry} />
      </Panel>
    </Layout>
  )
}
