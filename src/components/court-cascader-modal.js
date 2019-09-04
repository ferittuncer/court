import { Button, Cascader, Col, Modal, Row, Skeleton } from 'antd'
import React, { useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components/macro'
import { ReactComponent as Hexagon } from '../assets/images/hexagon.svg'
import skillsImg from '../assets/images/skills.png'
import rewardImg from '../assets/images/reward.png'
import { useDataloader } from '../bootstrap/dataloader'
import { useDrizzle } from '../temp/drizzle-react-hooks'
import Breadcrumbs from './breadcrumbs'

const StyledModal = styled(Modal)`
  position: relative;
  width: 90% !important;

  .ant-modal {
    &-header {
      padding: 0;
    }

    &-close-icon svg {
      fill: white;
    }

    &-body {
      background: whitesmoke;
      height: 286px;
      margin-top: -1px;
      overflow-x: scroll;
      position: relative;
    }

    &-footer {
      color: #4d00b4;
      height: 284px;
      margin-top: 40px;
      overflow-y: scroll;
      padding: 52px 42px 28px;
      text-align: left;
    }
  }
`

const SelectButtonArea = styled.div`
  background: #4004a3;
  height: 60px;
  margin: -52px -42px 0px -42px;
  padding: 0;
  position: absolute;
  top: 390px;
  width: 100%;
  z-index: 2;
`

const StyledButton = styled(Button)`
  border-radius: 3px;
  position: absolute;
  right: 44px;
  top: 15px;
  width: 100px;
  z-index: 3;
`
const StyledDiv = styled.div`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
`
const StyledHeader = styled.div`
  font-size: 18px;
  font-weight: bold;
`
const StyledTitleDiv = styled.div`
  background: #4004a3;
  color: white;
  font-size: 20px;
  font-weight: bold;
  height: 54px;
  line-height: 54px;
  text-align: center;
`
const StyledCascader = styled(Cascader)`
  display: none;

  & ~ div .popupClassName {
    background: whitesmoke;
    left: 0 !important;
    min-width: 100%;
    top: 0 !important;

    .ant-cascader-menu {
      border: 0;
      height: 286px;
      padding-top: 28px;
      width: 186px;

      &-item {
        height: 38px;
        padding: 5px 28px;

        &-active {
          color: white;
        }
      }
    }

    ul:nth-child(1) {
      background: #4004a3;
      border-radius: 0px;
    }

    ul:nth-child(3n + 1) {
      .ant-cascader-menu-item-active {
        background: #1e075f;
      }
    }

    ul:nth-child(3n + 2) {
      .ant-cascader-menu-item-active {
        background: #4004a3;
      }
    }

    ul:nth-child(3n) {
      .ant-cascader-menu-item-active {
        background: #009aff;
      }
    }
  }
`
const StyledBreadcrumbs = styled(Breadcrumbs)`
  left: ${props => props.colorIndex * 185}px;
  pointer-events: none;
  position: absolute;
  top: ${props => props.columnIndex * 38 + 28}px;
  z-index: ${props => props.optionLength - props.colorIndex + 2000};
`
const StyledPrefixDiv = styled.div`
  left: 29px;
  position: absolute;
  top: 29px;
  transform: translate(-50%, -50%);
`

const CourtCascaderModal = ({ onClick }) => {
  const { drizzle, useCacheCall } = useDrizzle()
  const loadPolicy = useDataloader.loadPolicy()
  const [subcourtIDs, setSubcourtIDs] = useState(['0'])
  const options = useCacheCall(['PolicyRegistry', 'KlerosLiquid'], call => {
    const options = [
      {
        children: undefined,
        description: undefined,
        label: undefined,
        loading: false,
        summary: undefined,
        value: subcourtIDs[0]
      }
    ]
    let option = options[0]
    for (let i = 0; i < subcourtIDs.length; i++) {
      const policy = call('PolicyRegistry', 'policies', subcourtIDs[i])
      if (policy !== undefined) {
        const policyJSON = loadPolicy(policy)
        if (policyJSON) {
          option.description = policyJSON.description
          option.label = policyJSON.name
          option.summary = policyJSON.summary
        }
      }
      const _court = call('KlerosLiquid', 'courts', i)
      if (_court !== undefined) {
        const _minStakeBN = drizzle.web3.utils.toBN(_court.minStake)
        option.minStake = _minStakeBN.toString()
        const _feeForJurorBN = drizzle.web3.utils.toBN(_court.feeForJuror)
        option.feeForJuror = _feeForJurorBN.toString()
      }
      const subcourt = call('KlerosLiquid', 'getSubcourt', subcourtIDs[i])
      if (subcourt)
        option.children = subcourt.children.map(c => {
          const child = {
            children: undefined,
            description: undefined,
            label: undefined,
            loading: false,
            summary: undefined,
            minStake: undefined,
            feeForJuror: undefined,
            value: c
          }
          const policy = call('PolicyRegistry', 'policies', c)
          if (policy !== undefined) {
            const policyJSON = loadPolicy(policy)
            if (policyJSON) {
              child.description = policyJSON.description
              child.label = policyJSON.name
              child.summary = policyJSON.summary
            }
          }
          if (child.label === undefined) child.loading = true
          const _court = call('KlerosLiquid', 'courts', i)
          if (_court !== undefined) {
            const _minStakeBN = drizzle.web3.utils.toBN(_court.minStake)
            child.minStake = _minStakeBN.toString()
            const _feeForJurorBN = drizzle.web3.utils.toBN(_court.feeForJuror)
            option.feeForJuror = _feeForJurorBN.toString()
          }
          return child
        })
      if (
        option.label === undefined ||
        !subcourt ||
        option.children.some(c => c.loading)
      ) {
        option.loading = true
        break
      }
      option = option.children.find(c => c.value === subcourtIDs[i + 1])
    }
    return options
  })
  const option = subcourtIDs.reduce((acc, ID, i) => {
    const index = acc.findIndex(option => option.value === ID)
    return i === subcourtIDs.length - 1
      ? {
          label: acc[index].label,
          description: acc[index].description,
          loading: acc[index].loading,
          summary: acc[index].summary,
          minStake: acc[index].minStake,
          reward: acc[index].feeForJuror
        }
      : acc[index].children
  }, options)
  return (
    <StyledModal
      centered
      footer={
        <>
          <SelectButtonArea>
            <StyledButton
              onClick={useCallback(
                () => onClick(subcourtIDs[subcourtIDs.length - 1]),
                [onClick, subcourtIDs[subcourtIDs.length - 1]]
              )}
              type="primary"
            >
              Stake
            </StyledButton>
          </SelectButtonArea>
          <Skeleton active loading={option.loading}>
            <Row gutter={16}>
              <Col md={12}>
                <StyledDiv>{`${option.label} | Min Stake = ${
                  option.minStake
                    ? drizzle.web3.utils.fromWei(option.minStake)
                    : ''
                } PNK`}</StyledDiv>
                <ReactMarkdown source={option.description} />
              </Col>
              <Col md={12}>
                <Row>
                  <Col md={4}>
                    <Hexagon className="ternary-fill" />
                    <StyledPrefixDiv>
                      <img src={skillsImg} />
                    </StyledPrefixDiv>
                  </Col>
                  <Col md={20}>
                    <StyledHeader>Required Skills</StyledHeader>
                    <ReactMarkdown source={option.description} />
                  </Col>
                </Row>
                <Row>
                  <Col md={4}>
                    <Hexagon className="ternary-fill" />
                    <StyledPrefixDiv style={{ top: '33px' }}>
                      <img src={rewardImg} />
                    </StyledPrefixDiv>
                  </Col>
                  <Col md={20}>
                    <StyledHeader>Reward</StyledHeader>
                    <div>
                      For each coherent vote you will receive
                      <span style={{ fontWeight: '600' }}>
                        {' '}
                        {option.reward
                          ? drizzle.web3.utils.fromWei(option.reward)
                          : ''}{' '}
                        ETH +
                      </span>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Skeleton>
        </>
      }
      onCancel={useCallback(() => onClick(), [onClick])}
      title={<StyledTitleDiv>Join Court</StyledTitleDiv>}
      visible
    >
      <StyledCascader
        changeOnSelect
        getPopupContainer={useCallback(
          () => document.getElementsByClassName('ant-modal-body')[0],
          []
        )}
        onChange={setSubcourtIDs}
        options={options}
        popupClassName="popupClassName"
        popupVisible
        value={subcourtIDs}
      />
      {subcourtIDs.slice(0, subcourtIDs.length - 1).map((ID, i) => {
        const subcourtIDsSubset = subcourtIDs.slice(
          0,
          subcourtIDs.indexOf(ID) + 1
        )
        const option = subcourtIDsSubset.reduce((acc, ID, i) => {
          const index = acc.findIndex(option => option.value === ID)
          return i === subcourtIDsSubset.length - 1
            ? { index, label: acc[index].label || '' }
            : acc[index].children
        }, options)
        return (
          <StyledBreadcrumbs
            breadcrumbs={option.label}
            colorIndex={i}
            columnIndex={option.index}
            key={`${ID}-${i}`}
            large
            optionLength={subcourtIDs.length}
          />
        )
      })}
    </StyledModal>
  )
}

CourtCascaderModal.propTypes = {
  onClick: PropTypes.func.isRequired
}

export default CourtCascaderModal
